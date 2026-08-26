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

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [selectedLocality, setSelectedLocality] = useState("Maharagama");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [activeChatJobId, setActiveChatJobId] = useState<string | null>("JOB-7821");
  const [statusFilter, setStatusFilter] = useState<"all" | "en_route" | "in_progress" | "requested">("all");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setJobs(jobService.getJobs());
  }, []);

  const activeJobs = jobs.filter((j) => j.stage !== "COMPLETED" && j.stage !== "CANCELLED");
  const activeChatJob = jobs.find((j) => j.id === activeChatJobId) || activeJobs[0] || jobs[0];

  const handleCreateJob = (data: Omit<JobRequest, "id" | "createdAt" | "stage" | "stageUpdatedAt">) => {
    const newJob = jobService.createJob(data);
    setJobs(jobService.getJobs());
    setActiveChatJobId(newJob.id);
  };

  const handleAdvanceStage = (jobId: string, nextStage: JobRequest["stage"]) => {
    jobService.advanceStage(jobId, nextStage);
    setJobs(jobService.getJobs());
  };

  const handleReviewSubmit = (jobId: string, rating: number, review: string) => {
    jobService.submitReview(jobId, rating, review);
    setJobs(jobService.getJobs());
  };

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
      }}
    >
      {/* ── Left Sidebar Navigation (3 Main Tabs) ── */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPostJob={() => setIsPostModalOpen(true)}
        activeJobsCount={activeJobs.length}
      />

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <DashboardHeader
          selectedLocality={selectedLocality}
          onChangeLocality={setSelectedLocality}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main style={{ padding: "32px", flex: 1, display: "flex", flexDirection: "column", gap: "28px" }}>
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
                  gridTemplateColumns: activeChatJob ? "1.15fr 0.85fr" : "1fr",
                  gap: "24px",
                  alignItems: "start",
                }}
              >
                {/* Left Column: Active Orders */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                        Active Work Orders & Live Tracking ({activeJobs.length})
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                        Real-time GPS route telemetry, stage updates, and worker arrival ETAs
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
                      <span>New Request</span>
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[
                      { id: "all", label: "All Active" },
                      { id: "en_route", label: "En Route" },
                      { id: "in_progress", label: "In Progress" },
                      { id: "requested", label: "Pending Match" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setStatusFilter(f.id as any)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: statusFilter === f.id ? "var(--accent)" : "var(--card-bg)",
                          color: statusFilter === f.id ? "var(--accent-text)" : "var(--text-primary)",
                          border: "1px solid var(--border)",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
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
                      <Sparkles size={32} color="var(--accent)" style={{ marginBottom: "12px" }} />
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
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", minHeight: "680px" }}>
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
                  Active Worker Conversations ({jobs.length})
                </div>

                {jobs.map((job) => {
                  const isSelected = activeChatJobId === job.id;
                  const worker = job.assignedWorker;
                  if (!worker) return null;

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
                          backgroundColor: worker.avatarBg,
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "13px",
                          flexShrink: 0,
                        }}
                      >
                        {worker.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {worker.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {job.title}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right: Full Chat Dock */}
              {activeChatJob && (
                <LiveChatDock
                  job={activeChatJob}
                  onClose={() => setActiveTab("active")}
                />
              )}
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
                  Direct settlements (Cash on Hand & Bank Transfer), completed job logs, and verified reviews
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
