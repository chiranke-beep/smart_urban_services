"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Star,
  Banknote,
  Landmark,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Wallet,
} from "lucide-react";
import { JobRequest } from "@/types/job";
import { formatCurrency, formatRelativeTime } from "@/utils/formatters";
import { useTheme } from "@/components/ThemeProvider";

interface JobHistoryTableProps {
  jobs: JobRequest[];
  onSubmitReview: (jobId: string, rating: number, review: string) => void;
}

export function JobHistoryTable({ jobs, onSubmitReview }: JobHistoryTableProps) {
  const [reviewingJob, setReviewingJob] = useState<JobRequest | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const completedJobs = jobs.filter((j) => j.stage === "COMPLETED");
  const totalSettledLKR = completedJobs.reduce((sum, j) => sum + (j.costLKR || 0), 0);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingJob || !reviewText.trim()) return;

    onSubmitReview(reviewingJob.id, rating, reviewText);
    setReviewingJob(null);
    setReviewText("");
  };

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: "0px",
        padding: "28px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Top Header & Lifetime Summary */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "24px",
          paddingBottom: "18px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Payment & Job History ({completedJobs.length})
          </h3>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0 }}>
            Direct settlements paid upon job completion (Cash on Hand & Bank Transfer)
          </p>
        </div>

        {/* Lifetime Settled Stat */}
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Wallet size={18} color="#10b981" />
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Settled Payments
            </div>
            <div style={{ fontSize: "17px", fontWeight: 900, color: "#10b981" }}>
              {formatCurrency(totalSettledLKR)}
            </div>
          </div>
        </div>
      </div>

      {completedJobs.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
          No completed jobs yet. Active jobs will appear here once marked as finished!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {completedJobs.map((job) => {
            const isCash = job.paymentMethod === "Cash on Hand" || !job.paymentMethod;

            return (
              <div
                key={job.id}
                style={{
                  padding: "20px",
                  backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Row 1: Worker Info, Amount, Payment Method Badge */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  {/* Worker & Job Title */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        backgroundColor: job.assignedWorker?.avatarBg || "#10b981",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "15px",
                      }}
                    >
                      {job.assignedWorker?.name.split(" ").map((n) => n[0]).join("") || "W"}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "15.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                          {job.title}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            backgroundColor: "rgba(16,185,129,0.15)",
                            color: "#10b981",
                          }}
                        >
                          ✓ Finished & Settled
                        </span>
                      </div>
                      <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Worker: <strong style={{ color: "var(--text-primary)" }}>{job.assignedWorker?.name}</strong> ({job.assignedWorker?.trade}) · {job.locality}, {job.district}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details & Settlement Method */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Settled Amount</div>
                      <div style={{ fontSize: "17px", fontWeight: 900, color: "var(--text-primary)" }}>
                        {formatCurrency(job.costLKR || 3000)}
                      </div>
                    </div>

                    {/* Payment Method Badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        backgroundColor: isCash ? "rgba(16,185,129,0.12)" : "rgba(66,214,255,0.12)",
                        color: isCash ? "#10b981" : "var(--accent)",
                        fontSize: "12px",
                        fontWeight: 700,
                        border: "1px solid var(--border)",
                      }}
                    >
                      {isCash ? <Banknote size={14} /> : <Landmark size={14} />}
                      <span>{job.paymentMethod || "Cash on Hand"}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Testimonial & Review Section */}
                <div
                  style={{
                    paddingTop: "12px",
                    borderTop: "1px dashed var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  {job.ratingGiven ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ display: "flex", gap: "3px" }}>
                        {[...Array(job.ratingGiven)].map((_, i) => (
                          <Star key={i} size={14} fill="#eab308" color="#eab308" />
                        ))}
                      </div>
                      <span style={{ fontSize: "13px", color: "var(--text-primary)", fontStyle: "italic" }}>
                        &ldquo;{job.reviewGiven}&rdquo;
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <ShieldCheck size={14} color="#10b981" />
                      <span>Help the Sri Lankan community by submitting verified feedback for this technician.</span>
                    </span>
                  )}

                  {!job.ratingGiven && (
                    <button
                      onClick={() => setReviewingJob(job)}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: "var(--accent)",
                        color: "var(--accent-text)",
                        border: "none",
                        fontWeight: 800,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Star size={13} fill="var(--accent-text)" />
                      <span>Submit Review</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewingJob && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              backgroundColor: "var(--card-bg)",
              border: "1.5px solid var(--accent)",
              padding: "28px",
              borderRadius: "0px",
              backdropFilter: "blur(20px)",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "6px" }}>
              Submit Community Review
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "18px" }}>
              Rate your direct service experience with <strong>{reviewingJob.assignedWorker?.name}</strong>:
            </p>

            <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                  Rating Score:
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                      }}
                    >
                      <Star
                        size={28}
                        fill={star <= rating ? "#eab308" : "none"}
                        color={star <= rating ? "#eab308" : "var(--text-secondary)"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                  Your Review / Comment:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Arrived on time with proper chainsaw equipment. Very polite and accepted cash upon completion."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "inherit",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setReviewingJob(null)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-text)",
                    border: "none",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Publish Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
