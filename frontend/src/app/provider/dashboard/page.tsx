"use client";

import React, { useState, useEffect } from "react";
import { ProviderSidebar } from "@/components/provider/ProviderSidebar";
import { ProviderHeader } from "@/components/provider/ProviderHeader";
import { IncomingJobCard } from "@/components/provider/IncomingJobCard";
import { ProviderActiveJobCard } from "@/components/provider/ProviderActiveJobCard";
import { ProviderEarningsTable } from "@/components/provider/ProviderEarningsTable";
import { LiveChatDock } from "@/components/dashboard/LiveChatDock";
import { JobRequest, Quotation } from "@/types/job";
import { jobService } from "@/services/jobService";
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

export default function ProviderDashboardPage() {
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [isOnline, setIsOnline] = useState(true);
  const [selectedLocality, setSelectedLocality] = useState("Maharagama");
  const [activeChatJobId, setActiveChatJobId] = useState<string | null>("JOB-7821");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setJobs(jobService.getJobs());
  }, []);

  const activeJobs = jobs.filter((j) => j.stage !== "COMPLETED" && j.stage !== "CANCELLED");
  const currentAssignedJob = activeJobs[0] || jobs[0];
  const activeChatJob = jobs.find((j) => j.id === activeChatJobId) || currentAssignedJob;

  // Mock incoming broadcasts for demo
  const [incomingJobs, setIncomingJobs] = useState<JobRequest[]>([
    {
      id: "JOB-9104",
      title: "Dangerous Overhanging Tree Branch Above Power Line",
      category: "tree-cutting",
      description: "Coconut tree branch is resting on Ceylon Electricity Board wires. Needs careful chainsaw branch cutting.",
      locality: "Maharagama Town",
      district: "Colombo",
      address: "No. 18, High Level Road, Maharagama",
      urgency: "emergency",
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      stage: "REQUESTED",
      stageUpdatedAt: new Date().toISOString(),
      photos: ["tree_danger.jpg"],
    },
    {
      id: "JOB-8841",
      title: "Front Lawn & Boundary Wall Compound Cleaning",
      category: "cleaning",
      description: "Post-rain debris and deep yard sweeping. High-pressure water cleaner needed for boundary moss.",
      locality: "Nugegoda",
      district: "Colombo",
      urgency: "today",
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      stage: "REQUESTED",
      stageUpdatedAt: new Date().toISOString(),
    },
  ]);

  const handleSendQuote = (
    jobId: string,
    quoteData: Omit<Quotation, "id" | "workerId" | "workerName" | "avatarBg" | "submittedAt" | "status">
  ) => {
    // Remove from incoming broadcast and add to active jobs
    const targetJob = incomingJobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const fullJob: JobRequest = {
      ...targetJob,
      stage: "EN_ROUTE",
      stageUpdatedAt: new Date().toISOString(),
      etaMinutes: 14,
      assignedWorker: {
        id: "W-401",
        name: "Sunil Kumara",
        trade: "Master Tree Climber & Yard Care",
        rating: 4.9,
        reviewCount: 142,
        phone: "+94 77 123 4567",
        avatarBg: "#10b981",
        verified: true,
        vehicleType: "Three Wheeler & Chainsaw Gear",
        plateNumber: "WP-ABX-8821",
      },
      quotation: {
        id: `Q-${Date.now()}`,
        workerId: "W-401",
        workerName: "Sunil Kumara",
        avatarBg: "#10b981",
        amountLKR: quoteData.amountLKR,
        rateType: quoteData.rateType,
        notes: quoteData.notes,
        submittedAt: new Date().toISOString(),
        status: "accepted",
      },
      costLKR: quoteData.amountLKR,
      paymentMethod: "Cash on Hand",
    };

    setIncomingJobs((prev) => prev.filter((j) => j.id !== jobId));
    jobService.createJob(fullJob);
    setJobs(jobService.getJobs());
    setActiveTab("active");
  };

  const handleDeclineIncoming = (jobId: string) => {
    setIncomingJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const handleAdvanceStage = (jobId: string, nextStage: JobRequest["stage"]) => {
    jobService.advanceStage(jobId, nextStage);
    setJobs(jobService.getJobs());
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "inherit",
      }}
    >
      {/* ── Left Sidebar Navigation ── */}
      <ProviderSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        incomingCount={incomingJobs.length}
        activeJobsCount={activeJobs.length}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(!isOnline)}
      />

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <ProviderHeader
          selectedLocality={selectedLocality}
          isOnline={isOnline}
        />

        <main style={{ padding: "32px", flex: 1, display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* ═══════════════════════════════════════════════════════════════
              TAB 1: ACTIVE JOB & GPS NAVIGATION (PRIMARY VIEW)
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "active" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: activeChatJob ? "1.15fr 0.85fr" : "1fr",
                gap: "24px",
                alignItems: "start",
              }}
            >
              {/* Left: Active Work Order Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                    Current Assigned Dispatch ({activeJobs.length})
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                    Turn-by-turn route navigation to customer property & direct cash/bank settlement
                  </p>
                </div>

                {currentAssignedJob ? (
                  <ProviderActiveJobCard
                    job={currentAssignedJob}
                    onOpenChat={(id) => setActiveChatJobId(id)}
                    onAdvanceStage={handleAdvanceStage}
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
                    <Sparkles size={32} color="#10b981" style={{ marginBottom: "12px" }} />
                    <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "6px" }}>
                      No Active Work Orders Right Now
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                      Check the Broadcast Feed to quote and accept incoming local jobs.
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
                      View Incoming Broadcast Feed ({incomingJobs.length})
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>
                    Live Broadcast Feed ({incomingJobs.length} New)
                  </h2>
                  <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: 0 }}>
                    Nearby homeowner requests broadcasted within your 10 km service radius
                  </p>
                </div>

                <div
                  style={{
                    padding: "6px 14px",
                    backgroundColor: isOnline ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.1)",
                    border: "1px solid var(--border)",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    color: isOnline ? "#10b981" : "var(--text-secondary)",
                  }}
                >
                  {isOnline ? "● RADAR RECEIVING BROADCASTS" : "● RADAR OFF"}
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
                    onSendQuote={handleSendQuote}
                    onDecline={handleDeclineIncoming}
                  />
                ))
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 3: HOMEOWNER CHAT HUB
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "chat" && (
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", minHeight: "680px" }}>
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
                  Customer Conversations ({jobs.length})
                </div>

                {jobs.map((job) => {
                  const isSelected = activeChatJobId === job.id;

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
                        HO
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          Homeowner ({job.locality})
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {job.title}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right: Active Chat Window */}
              {activeChatJob && (
                <LiveChatDock
                  job={activeChatJob}
                  onClose={() => setActiveTab("active")}
                />
              )}
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
