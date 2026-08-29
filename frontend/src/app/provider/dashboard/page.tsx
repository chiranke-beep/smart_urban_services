"use client";

import React, { useState, useEffect } from "react";
import { ProviderSidebar } from "@/components/provider/ProviderSidebar";
import { ProviderHeader } from "@/components/provider/ProviderHeader";
import { IncomingJobCard } from "@/components/provider/IncomingJobCard";
import { ProviderActiveJobCard } from "@/components/provider/ProviderActiveJobCard";
import { ProviderEarningsTable } from "@/components/provider/ProviderEarningsTable";
import { LiveChatDock } from "@/components/citizen/LiveChatDock";
import { jobService } from "@/services/jobService";
import { apiClient } from "@/services/api";
import {
  Radio,
  Navigation,
  MessageSquare,
  Wallet,
  ShieldCheck,
  Zap,
  Sparkles,
  MapPin,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import { JobRequest, Quotation } from "@/types/job";
import { socketService } from "@/services/socketService";
import { getAiDistanceAndEta } from "@/utils/geoDistance";

function isJobMatchingProviderSkills(jobCategory: string, providerTradeText?: string): boolean {
  if (!providerTradeText || !providerTradeText.trim()) return true;
  const text = providerTradeText.toLowerCase();
  const cat = (jobCategory || "").toLowerCase();

  if (text.includes("all") || text.includes("general") || text.includes("handyman") || text.includes("craftsman") || text.includes("specialist")) {
    return true;
  }

  if ((cat.includes("paint") || cat === "painting") && (text.includes("paint") || text.includes("decor") || text.includes("wall"))) {
    return true;
  }
  if ((cat.includes("tree") || cat === "tree-cutting" || cat === "waste" || cat.includes("yard")) && (text.includes("tree") || text.includes("yard") || text.includes("cut") || text.includes("garden"))) {
    return true;
  }
  if ((cat.includes("plumb") || cat === "plumbing" || cat === "water" || cat.includes("pipe")) && (text.includes("plumb") || text.includes("pipe") || text.includes("water") || text.includes("leak") || text.includes("tap"))) {
    return true;
  }
  if ((cat.includes("clean") || cat === "cleaning") && (text.includes("clean") || text.includes("wash") || text.includes("roof") || text.includes("sweep"))) {
    return true;
  }
  if ((cat.includes("pc") || cat.includes("tech") || cat === "pc-repair" || cat === "electricity" || cat.includes("electr")) && (text.includes("pc") || text.includes("tech") || text.includes("electr") || text.includes("repair") || text.includes("comput"))) {
    return true;
  }
  if ((cat.includes("odd") || cat === "odd_jobs" || cat === "road" || cat === "other") && (text.includes("odd") || text.includes("handy") || text.includes("mason") || text.includes("carpent") || text.includes("construct"))) {
    return true;
  }

  const words = text.split(/[\s,;&/]+/).filter((w) => w.length > 3);
  if (words.some((w) => cat.includes(w) || w.includes(cat))) {
    return true;
  }

  return false;
}

function isJobWithinProviderRadius(
  job: JobRequest,
  providerDistrict?: string,
  providerLocality?: string,
  providerLat?: number,
  providerLng?: number
): boolean {
  const provDist = (providerDistrict || "Colombo").toLowerCase().trim();
  const jobDist = (job.district || "Kandy").toLowerCase().trim();

  // Direct strict cross-district isolation
  if (provDist && jobDist && provDist !== jobDist) {
    if (
      (provDist.includes("colombo") && jobDist.includes("kandy")) ||
      (provDist.includes("kandy") && jobDist.includes("colombo")) ||
      (provDist.includes("galle") && jobDist.includes("kandy")) ||
      (provDist.includes("jaffna") && jobDist.includes("colombo")) ||
      (provDist.includes("matara") && jobDist.includes("kandy"))
    ) {
      return false;
    }
  }

  // Check Haversine distance
  const { distanceKm } = getAiDistanceAndEta(
    { lat: job.latitude, lng: job.longitude, locality: job.locality, district: job.district },
    { lat: providerLat, lng: providerLng, locality: providerLocality, district: providerDistrict }
  );

  // Maximum local dispatch radius: 35 km
  return distanceKm <= 35.0;
}

export default function ProviderDashboardPage() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [incomingJobs, setIncomingJobs] = useState<JobRequest[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [isOnline, setIsOnline] = useState(true);
  const [selectedLocality, setSelectedLocality] = useState("Maharagama");
  const [activeChatJobId, setActiveChatJobId] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Sync fresh profile from DB on mount to ensure true district/locality
  useEffect(() => {
    if (user?.id) {
      const rawId = String(user.id).replace(/\D/g, "");
      apiClient<{ success: boolean; data?: any }>(`/users/profile/${rawId}`)
        .then((res) => {
          if (res?.data) {
            updateUser({
              locality: res.data.locality,
              district: res.data.district,
              trade: res.data.trade,
              verifiedBadge: res.data.verified === true || res.data.verificationStatus === "APPROVED",
              verificationStatus: res.data.verificationStatus || (res.data.verified ? "APPROVED" : "PENDING"),
              rejectionReason: res.data.rejectionReason || undefined,
            });
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    jobService.fetchRemoteJobs().then((allJobs) => {
      setJobs(allJobs);
      setIncomingJobs(
        allJobs.filter(
          (j) =>
            j.stage === "REQUESTED" &&
            isJobMatchingProviderSkills(j.category, user?.trade) &&
            isJobWithinProviderRadius(j, user?.district, user?.locality, user?.savedLat, user?.savedLng)
        )
      );
    });

    const unsubIncoming = socketService.onIncomingJob((newJob: JobRequest) => {
      if (
        !isJobMatchingProviderSkills(newJob.category, user?.trade) ||
        !isJobWithinProviderRadius(newJob, user?.district, user?.locality, user?.savedLat, user?.savedLng)
      ) {
        return;
      }
      setIncomingJobs((prev) => {
        if (prev.some((j) => j.id === newJob.id)) return prev;
        return [newJob, ...prev];
      });
      // Also switch to feed tab when new broadcast arrives
      setActiveTab("feed");
    });

    const unsubStage = socketService.onStageChanged(() => {
      jobService.fetchRemoteJobs().then((refreshed) => {
        setJobs(refreshed);
        setIncomingJobs(
          refreshed.filter(
            (j) =>
              j.stage === "REQUESTED" &&
              isJobMatchingProviderSkills(j.category, user?.trade) &&
              isJobWithinProviderRadius(j, user?.district, user?.locality, user?.savedLat, user?.savedLng)
          )
        );
      });
    });

    return () => {
      unsubIncoming();
      unsubStage();
    };
  }, [user?.trade, user?.district, user?.locality, user?.savedLat, user?.savedLng]);

  // HTML5 Live Geolocation Telemetry Streaming (when LIVE LOCATION is ON)
  useEffect(() => {
    let watchId: number | null = null;
    if (isOnline && typeof window !== "undefined" && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          socketService.emitGpsMove({
            lat,
            lng,
            speed: pos.coords.speed || 30,
            timestamp: new Date().toISOString(),
          });
        },
        (err) => console.log("Geolocation status:", err.message),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isOnline]);

  const rawUserId = user?.id ? String(user.id).replace(/\D/g, "") : "";
  const acceptedJobs = jobs.filter(
    (j) =>
      j.stage !== "REQUESTED" &&
      (
        j.assignedWorker?.id === `W-${rawUserId}` ||
        j.quotation?.workerId === `W-${rawUserId}` ||
        j.quotation?.workerId === user?.id ||
        j.assignedWorker?.id === user?.id
      )
  );
  const activeJobs = acceptedJobs.filter(
    (j) => j.stage !== "COMPLETED" && j.stage !== "CANCELLED"
  );
  const currentAssignedJob = activeJobs[0] || null;
  const activeChatJob = activeChatJobId ? acceptedJobs.find((j) => j.id === activeChatJobId) : currentAssignedJob;
  const hasActiveJob = activeJobs.length > 0;

  const handleSendQuote = (
    jobId: string,
    quoteData: Omit<Quotation, "id" | "workerId" | "workerName" | "avatarBg" | "submittedAt" | "status">
  ) => {
    if (!user) return;
    if (user.verificationStatus === "REJECTED") {
      alert("Your account has been suspended by admin. Please contact support to resolve.");
      return;
    }
    if (hasActiveJob) {
      alert("You currently have an active job in progress. You can only work on 1 job at a time.");
      return;
    }
    jobService.acceptJob(jobId, user, quoteData.amountLKR);
    const refreshed = jobService.getJobs();
    setJobs(refreshed);
    setIncomingJobs((prev) => prev.filter((j) => j.id !== jobId));
    setActiveChatJobId(jobId);
    setActiveTab("active");
  };

  const handleDeclineIncoming = (jobId: string) => {
    setIncomingJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const handleAdvanceStage = (jobId: string, nextStage: JobRequest["stage"]) => {
    jobService.advanceStage(jobId, nextStage);
    const refreshed = jobService.getJobs();
    setJobs(refreshed);
    setIncomingJobs(
      refreshed.filter(
        (j) => j.stage === "REQUESTED" && isJobMatchingProviderSkills(j.category, user?.trade)
      )
    );
  };

  const handleUpdateQuote = (jobId: string, amountLKR: number) => {
    // Re-read from localStorage so the updated price is reflected in the jobs list
    const refreshed = jobService.getJobs();
    setJobs([...refreshed]);
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "inherit",
        position: "relative",
      }}
    >
      {/* ── Left Sidebar Navigation ── */}
      <ProviderSidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        incomingCount={incomingJobs.length}
        activeJobsCount={activeJobs.length}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(!isOnline)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <ProviderHeader
          selectedLocality={selectedLocality}
          isOnline={isOnline}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main style={{ padding: "clamp(16px, 3vw, 32px)", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* ═══════════════════════════════════════════════════════════════
              TAB 1: ACTIVE JOB & GPS NAVIGATION (PRIMARY VIEW)
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "active" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: activeChatJob ? "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" : "1fr",
                gap: "24px",
                alignItems: "start",
              }}
            >
              {/* Left: Active Work Order Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                    Active Job ({activeJobs.length})
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                    Live map navigation to customer location
                  </p>
                </div>

                {currentAssignedJob ? (
                  <ProviderActiveJobCard
                    job={currentAssignedJob}
                    onOpenChat={(id) => setActiveChatJobId(id)}
                    onAdvanceStage={handleAdvanceStage}
                    onUpdateQuote={handleUpdateQuote}
                  />
                ) : (
                  <div
                    style={{
                      padding: "48px",
                      textAlign: "center",
                      backgroundColor: "var(--card-bg)",
                      border: "1px dashed var(--border)",
                    }}
                  >
                    <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "6px" }}>
                      No Active Jobs Right Now
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                      Check new requests to quote and accept local jobs.
                    </p>
                    <button
                      onClick={() => setActiveTab("feed")}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#10b981",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      View New Requests ({incomingJobs.length})
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Docked Homeowner Chat */}
              {activeChatJob && (
                <div style={{ position: "sticky", top: "90px" }}>
                  <LiveChatDock
                    job={activeChatJob}
                    onClose={() => setActiveChatJobId(null)}
                  />
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 2: INCOMING BROADCAST FEED
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "feed" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>
                    Incoming Requests Feed ({incomingJobs.length} New)
                  </h2>
                  <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: 0 }}>
                    Direct citizen requests available within your service radius
                  </p>
                </div>
              </div>

              {incomingJobs.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", backgroundColor: "var(--card-bg)", border: "1px dashed var(--border)" }}>
                  No new broadcast requests in this area at the moment. Stay online to receive instant alerts!
                </div>
              ) : (
                incomingJobs.map((job) => (
                  <IncomingJobCard
                    key={job.id}
                    job={job}
                    hasActiveJob={hasActiveJob}
                    isVerified={user?.verifiedBadge === true || user?.verificationStatus === "APPROVED"}
                    verificationStatus={user?.verificationStatus}
                    rejectionReason={user?.rejectionReason}
                    onSendQuote={handleSendQuote}
                    onDecline={handleDeclineIncoming}
                    onNavigateToActiveJob={() => setActiveTab("active")}
                  />
                ))
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 3: HOMEOWNER CHAT HUB
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "chat" && (
            <div style={{ display: "grid", gridTemplateColumns: acceptedJobs.length > 0 ? "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" : "1fr", gap: "24px", minHeight: "680px" }}>
              {/* Left: Homeowner Chat Sessions */}
              <div
                style={{
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 800, padding: "8px 4px 12px", borderBottom: "1px solid var(--border)" }}>
                  Customer Conversations ({acceptedJobs.length})
                </div>

                {acceptedJobs.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center" }}>
                    <MessageSquare size={28} color="var(--text-secondary)" style={{ margin: "0 auto 10px", opacity: 0.6 }} />
                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>No Active Conversations</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                      You have 0 accepted jobs. Accept incoming requests from the Broadcast Feed to initiate encrypted live chat.
                    </div>
                    <button
                      onClick={() => setActiveTab("feed")}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#10b981",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: 800,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Go to Broadcast Feed ({incomingJobs.length})
                    </button>
                  </div>
                ) : (
                  acceptedJobs.map((job) => {
                    const isSelected = (activeChatJobId || acceptedJobs[0]?.id) === job.id;
                    const citizenDisplayName = job.citizenName || "Citizen";
                    const citizenInitials = citizenDisplayName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <button
                        key={job.id}
                        onClick={() => setActiveChatJobId(job.id)}
                        style={{
                          padding: "12px",
                          backgroundColor: isSelected
                            ? "rgba(16,185,129,0.12)"
                            : "transparent",
                          borderLeft: isSelected ? "3px solid #10b981" : "3px solid transparent",
                          borderTop: "none",
                          borderRight: "none",
                          borderBottom: "1px solid var(--border)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          textAlign: "left",
                          fontFamily: "inherit",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            backgroundColor: "#0891b2",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "13px",
                            flexShrink: 0,
                          }}
                        >
                          {citizenInitials}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                            {citizenDisplayName} ({job.locality})
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                            {job.title}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right: Active Chat Window */}
              {activeChatJob ? (
                <LiveChatDock
                  job={activeChatJob}
                  onClose={() => setActiveTab("active")}
                />
              ) : acceptedJobs.length > 0 && acceptedJobs[0] ? (
                <LiveChatDock
                  job={acceptedJobs[0]}
                  onClose={() => setActiveTab("active")}
                />
              ) : null}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 4: EARNINGS & REVIEWS
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "earnings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>
                  Worker Earnings & Direct Payouts
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: 0 }}>
                  100% direct payouts retained with zero middleman deductions
                </p>
              </div>

              <ProviderEarningsTable jobs={jobs} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
