"use client";

import React, { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/citizen/DashboardSidebar";
import { DashboardHeader } from "@/components/citizen/DashboardHeader";
import { ActiveDispatchCard } from "@/components/citizen/ActiveDispatchCard";
import { LiveChatDock } from "@/components/citizen/LiveChatDock";
import { QuickJobPostModal } from "@/components/citizen/QuickJobPostModal";
import { JobHistoryTable } from "@/components/citizen/JobHistoryTable";
import { JobRequest } from "@/types/job";
import { jobService } from "@/services/jobService";
import { CATEGORY_DEFINITIONS } from "@/utils/constants";
import {
  Sparkles,
  CheckCircle2,
  Plus,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  MessageSquare,
  ClipboardList,
  History,
  Filter,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { socketService } from "@/services/socketService";

function DashboardContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [selectedLocality, setSelectedLocality] = useState("Maharagama");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [activeChatJobId, setActiveChatJobId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "en_route" | "in_progress" | "requested">("all");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (searchParams?.get("openPost") === "true") {
      setIsPostModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    jobService.fetchRemoteJobs().then((remote) => {
      setJobs(remote);
    });

    const unsubStage = socketService.onStageChanged((data) => {
      if (data?.jobId && data?.stage) {
        setJobs((prev) =>
          prev.map((j) => (j.id === data.jobId ? { ...j, stage: data.stage as any } : j))
        );
      }
      jobService.fetchRemoteJobs().then((remote) => {
        setJobs(remote);
      });
    });

    const unsubQuote = socketService.onQuotationUpdated((data) => {
      setJobs((prev) => {
        const updated = prev.map((j) => {
          if (j.id === data.jobId) {
            return {
              ...j,
              costLKR: Number(data.amountLKR),
              stage: "QUOTED" as const,
              quotation: {
                id: `quote-${Date.now()}`,
                workerId: data.workerId || data.providerId || "worker",
                workerName: data.workerName || "Technician",
                avatarBg: "var(--accent)",
                amountLKR: Number(data.amountLKR),
                rateType: "fixed" as const,
                notes: data.notes || "Official quotation",
                submittedAt: new Date().toISOString(),
                status: "pending" as const,
              },
            };
          }
          return j;
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("sus_live_db_jobs_v6", JSON.stringify(updated));
        }
        return updated;
      });
    });

    return () => {
      unsubStage();
      unsubQuote();
    };
  }, []);

  const activeJobs = jobs.filter((j) => j.stage !== "COMPLETED" && j.stage !== "CANCELLED");
  const activeChatJob = jobs.find((j) => j.id === activeChatJobId) || null;

  const handleCreateJob = async (data: Omit<JobRequest, "id" | "createdAt" | "stage" | "stageUpdatedAt">) => {
    const newJob = await jobService.createJob(data);
    const updated = await jobService.fetchRemoteJobs();
    setJobs(updated);
    setActiveChatJobId(newJob.id);
  };

  const handleCancelJob = async (jobId: string) => {
    jobService.cancelJob(jobId);
    const updated = await jobService.fetchRemoteJobs();
    setJobs(updated);
    if (activeChatJobId === jobId) {
      setActiveChatJobId(null);
    }
  };

  const handleAcceptQuote = async (jobId: string) => {
    // Accept the quote locally (sets stage EN_ROUTE)
    jobService.acceptQuote(jobId);
    // Emit stage change via socket so service provider sees it instantly
    socketService.updateStage(jobId, "EN_ROUTE");
    // Refresh from local storage (don't re-fetch to preserve quotation data)
    setJobs([...jobService.getJobs()]);
  };

  const handleAdvanceStage = (jobId: string, nextStage: JobRequest["stage"]) => {
    jobService.advanceStage(jobId, nextStage);
    setJobs(jobService.getJobs());
  };

  const handleReviewSubmit = (jobId: string, rating: number, review: string) => {
    jobService.submitReview(jobId, rating, review, user?.id);
    setJobs(jobService.getJobs());
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredActiveJobs = activeJobs.filter((job) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${job.title} ${job.description} ${job.locality} ${job.assignedWorker?.name || ""}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    if (statusFilter === "en_route") return job.stage === "EN_ROUTE";
    if (statusFilter === "in_progress") return job.stage === "IN_PROGRESS";
    if (statusFilter === "requested") return job.stage === "REQUESTED" || job.stage === "QUOTED";
    return true;
  });

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
      {/* ── Left Sidebar Navigation (3 Main Tabs) ── */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onOpenPostJob={() => {
          setIsPostModalOpen(true);
          setIsMobileMenuOpen(false);
        }}
        activeJobsCount={activeJobs.length}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <DashboardHeader
          selectedLocality={selectedLocality}
          onChangeLocality={setSelectedLocality}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main style={{ padding: "clamp(16px, 3vw, 32px)", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* ═══════════════════════════════════════════════════════════════
              TAB 1: ACTIVE ORDERS & LIVE GPS (PRIMARY VIEW)
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "active" && (
            <>
              {/* Top Quick 1-Click Category Launcher */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "14px",
                }}
              >
                {CATEGORY_DEFINITIONS.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setIsPostModalOpen(true)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "0px",
                        backgroundColor: "var(--card-bg)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer",
                        textAlign: "left",
                        backdropFilter: "blur(12px)",
                        transition: "transform 0.2s ease, border-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.borderColor = cat.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>
                          {cat.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          1-Click Request
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Main Split: Active Dispatch Cards + GPS Map (Left) vs Docked Chat (Right) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: activeChatJob ? "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" : "1fr",
                  gap: "24px",
                  alignItems: "start",
                }}
              >
                {/* Left Column: Active Orders */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                        Active Jobs ({activeJobs.length})
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                        Live map tracking and arrival updates
                      </p>
                    </div>

                    <button
                      onClick={() => setIsPostModalOpen(true)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "0px",
                        backgroundColor: "transparent",
                        border: "1.5px solid var(--accent)",
                        color: "var(--accent)",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Plus size={15} />
                      <span>Post Job Request</span>
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
                    {[
                      { id: "all", label: "All Active" },
                      { id: "en_route", label: "On the way" },
                      { id: "in_progress", label: "Working" },
                      { id: "requested", label: "Waiting for Worker" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setStatusFilter(f.id as any)}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: statusFilter === f.id ? "var(--accent)" : "var(--card-bg)",
                          color: statusFilter === f.id ? "var(--accent-text)" : "var(--text-primary)",
                          border: "1px solid var(--border)",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {filteredActiveJobs.length === 0 ? (
                    <div
                      style={{
                        padding: "48px",
                        textAlign: "center",
                        backgroundColor: "var(--card-bg)",
                        border: "1px dashed var(--border)",
                      }}
                    >
                      <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "6px" }}>
                        No Active Job Requests
                      </h3>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                        Need a tree cut, pipe repaired, or wall painted? Broadcast a request in seconds.
                      </p>
                      <button
                        onClick={() => setIsPostModalOpen(true)}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "var(--accent)",
                          color: "var(--accent-text)",
                          border: "none",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        + Post First Service Request
                      </button>
                    </div>
                  ) : (
                    filteredActiveJobs.map((job) => (
                      <ActiveDispatchCard
                        key={job.id}
                        job={job}
                        onOpenChat={(id) => setActiveChatJobId(id)}
                        onAdvanceStage={handleAdvanceStage}
                        onCancelJob={handleCancelJob}
                        onAcceptQuote={handleAcceptQuote}
                      />
                    ))
                  )}
                </div>

                {/* Right Column: Docked Live Chat Hub */}
                {activeChatJob && (
                  <div style={{ position: "sticky", top: "90px" }}>
                    <LiveChatDock
                      job={activeChatJob}
                      onClose={() => setActiveChatJobId(null)}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 2: WORKER CHAT HUB VIEW
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "chat" && (
            <div style={{ display: "grid", gridTemplateColumns: activeJobs.length > 0 ? "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" : "1fr", gap: "24px", minHeight: "680px" }}>
              {/* Left: Chat Sessions List */}
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
                  Active Worker Conversations ({activeJobs.length})
                </div>

                {activeJobs.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center" }}>
                    <MessageSquare size={28} color="var(--text-secondary)" style={{ margin: "0 auto 10px", opacity: 0.6 }} />
                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>No Active Conversations</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                      Post a new job request to connect with local verified technicians in real time.
                    </div>
                    <button
                      onClick={() => setIsPostModalOpen(true)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "var(--accent)",
                        color: "var(--accent-text)",
                        border: "none",
                        fontWeight: 800,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      + Post New Job Request
                    </button>
                  </div>
                ) : (
                  activeJobs.map((job) => {
                    const isSelected = (activeChatJobId || activeJobs[0]?.id) === job.id;
                    const worker = job.assignedWorker;

                    return (
                      <button
                        key={job.id}
                        onClick={() => setActiveChatJobId(job.id)}
                        style={{
                          padding: "12px",
                          backgroundColor: isSelected
                            ? "rgba(66,214,255,0.12)"
                            : "transparent",
                          borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
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
                            backgroundColor: worker?.avatarBg || "var(--accent)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "13px",
                            flexShrink: 0,
                          }}
                        >
                          {worker ? worker.name.split(" ").map((n) => n[0]).join("") : "SP"}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                            {worker?.name || "Service Provider Dispatch"}
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

              {/* Right: Full Chat Dock */}
              {activeChatJob ? (
                <LiveChatDock
                  job={activeChatJob}
                  onClose={() => setActiveTab("active")}
                />
              ) : activeJobs.length > 0 && activeJobs[0] ? (
                <LiveChatDock
                  job={activeJobs[0]}
                  onClose={() => setActiveTab("active")}
                />
              ) : null}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 3: PAYMENTS & JOB HISTORY VIEW
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>
                  Payments & Job History
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: 0 }}>
                  Direct settlements, completed job logs, and verified reviews
                </p>
              </div>

              <JobHistoryTable jobs={jobs} onSubmitReview={handleReviewSubmit} />
            </div>
          )}
        </main>
      </div>

      {/* ── Quick Job Post Wizard Modal ── */}
      <QuickJobPostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSubmitJob={handleCreateJob}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-base)" }}>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
