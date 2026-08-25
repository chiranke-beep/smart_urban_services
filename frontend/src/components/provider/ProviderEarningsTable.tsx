"use client";

import React from "react";
import {
  Wallet,
  Banknote,
  Landmark,
  Star,
  ShieldCheck,
  Calendar,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { JobRequest } from "@/types/job";
import { formatCurrency, formatRelativeTime } from "@/utils/formatters";
import { useTheme } from "@/components/ThemeProvider";

interface ProviderEarningsTableProps {
  jobs: JobRequest[];
}

export function ProviderEarningsTable({ jobs }: ProviderEarningsTableProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const completedJobs = jobs.filter((j) => j.stage === "COMPLETED");
  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.costLKR || 3000), 0);
  const cashTotal = completedJobs
    .filter((j) => j.paymentMethod === "Cash on Hand" || !j.paymentMethod)
    .reduce((sum, j) => sum + (j.costLKR || 3000), 0);
  const bankTotal = totalEarnings - cashTotal;

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: "0px",
        padding: "28px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Top 3 Metric Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {/* Total Earnings */}
        <div
          style={{
            padding: "20px",
            backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.25)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Total Earnings (100% Retained)
            </span>
            <Wallet size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#10b981" }}>
            {formatCurrency(totalEarnings)}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
            Zero commission deducted
          </div>
        </div>

        {/* Cash vs Bank Transfer Split */}
        <div
          style={{
            padding: "20px",
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Payment Methods Breakdown
            </span>
            <Banknote size={18} color="var(--accent)" />
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            Cash on Hand: <strong>{formatCurrency(cashTotal)}</strong>
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            Bank Transfer: <strong>{formatCurrency(bankTotal)}</strong>
          </div>
        </div>

        {/* Quality Rating */}
        <div
          style={{
            padding: "20px",
            backgroundColor: isDark ? "rgba(234,179,8,0.08)" : "rgba(234,179,8,0.06)",
            border: "1px solid rgba(234,179,8,0.25)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Customer Trust Index
            </span>
            <Star size={18} color="#eab308" fill="#eab308" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#eab308" }}>
            4.9 ★ Rating
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
            Based on 142 verified jobs in Colombo
          </div>
        </div>
      </div>

      {/* Completed Jobs Log & Customer Reviews */}
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "16px" }}>
          Completed Jobs & Customer Testimonials ({completedJobs.length})
        </h3>

        {completedJobs.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
            No completed jobs yet. Completed work orders will show up here with verified customer reviews!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {completedJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  padding: "18px 20px",
                  backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "15.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Location: {job.locality}, {job.district} · {formatRelativeTime(job.createdAt)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#10b981" }}>
                      {formatCurrency(job.costLKR || 3000)}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                      Collected via {job.paymentMethod || "Cash on Hand"}
                    </div>
                  </div>
                </div>

                {/* Testimonial Quote */}
                {job.reviewGiven && (
                  <div
                    style={{
                      padding: "10px 14px",
                      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                      border: "1px dashed var(--border)",
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      fontStyle: "italic",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Star size={14} fill="#eab308" color="#eab308" />
                    <span>&ldquo;{job.reviewGiven}&rdquo;</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
