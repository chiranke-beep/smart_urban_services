"use client";

import React from "react";
import {
  PhoneCall,
  MessageSquare,
  MapPin,
  Clock,
  Navigation,
  CheckCircle,
  Truck,
  ArrowRight,
  ShieldCheck,
  Banknote,
  Landmark,
} from "lucide-react";
import { JobRequest } from "@/types/job";
import { LiveGpsRouteMap } from "../dashboard/LiveGpsRouteMap";
import { formatCurrency, formatETA } from "@/utils/formatters";
import { useTheme } from "@/components/ThemeProvider";

interface ProviderActiveJobCardProps {
  job: JobRequest;
  onOpenChat: (jobId: string) => void;
  onAdvanceStage: (jobId: string, stage: JobRequest["stage"]) => void;
}

export function ProviderActiveJobCard({
  job,
  onOpenChat,
  onAdvanceStage,
}: ProviderActiveJobCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        padding: "28px",
        borderRadius: "0px",
        backgroundColor: "var(--card-bg)",
        border: "1.5px solid #10b981",
        boxShadow: "0 16px 36px -10px rgba(16,185,129,0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "relative",
      }}
    >
      {/* Top Status & Homeowner Address */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              backgroundColor: "rgba(16,185,129,0.15)",
              color: "#10b981",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981" }} />
            ASSIGNED WORK ORDER · #{job.id}
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Stage: {job.stage}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "var(--text-primary)", fontWeight: 700 }}>
          <MapPin size={15} color="#10b981" />
          <span>{job.address || "No. 42, Temple Road, Maharagama"}</span>
        </div>
      </div>

      {/* Main Job Title & Description */}
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "8px",
          }}
        >
          {job.title}
        </h3>
        <p style={{ fontSize: "14.5px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
          {job.description}
        </p>
      </div>

      {/* Live Route Navigation GPS Map */}
      <LiveGpsRouteMap
        workerName="You (Sunil Kumara)"
        vehiclePlate="WP-ABX-8821"
        locality={job.locality}
        etaMinutes={job.etaMinutes}
        stage={job.stage}
        onGeofenceArrival={() => onAdvanceStage(job.id, "IN_PROGRESS")}
      />

      {/* Homeowner Contact & Payout Bar */}
      <div
        style={{
          marginTop: "20px",
          padding: "18px 20px",
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
          border: "1px solid var(--border)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
            Approved Direct Payout (Zero Commission)
          </div>
          <div style={{ fontSize: "20px", fontWeight: 900, color: "#10b981", marginTop: "2px" }}>
            {formatCurrency(job.quotation?.amountLKR || job.costLKR || 3500)}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Payment Mode: <strong>Direct Cash on Hand or Bank Transfer</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => onOpenChat(job.id)}
            style={{
              padding: "10px 18px",
              borderRadius: "0px",
              backgroundColor: "var(--accent)",
              color: "var(--accent-text)",
              border: "none",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <MessageSquare size={16} />
            <span>Chat Homeowner</span>
          </button>

          <a
            href="tel:+94771234567"
            style={{
              padding: "10px 16px",
              borderRadius: "0px",
              backgroundColor: "transparent",
              border: "1.5px solid var(--border)",
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <PhoneCall size={15} />
            <span>Call Homeowner</span>
          </a>
        </div>
      </div>

      {/* Technician Stage Advance Actions */}
      <div
        style={{
          marginTop: "16px",
          padding: "14px 18px",
          backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)",
          border: "1.5px solid rgba(16,185,129,0.3)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <ShieldCheck size={18} color="#10b981" />
          <span>
            <strong>Current Work State:</strong>{" "}
            {job.stage === "EN_ROUTE"
              ? "Travelling to customer destination via High Level Rd"
              : job.stage === "IN_PROGRESS"
              ? "On site at property. Task underway."
              : "Job completed."}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {job.stage === "EN_ROUTE" && (
            <button
              onClick={() => onAdvanceStage(job.id, "IN_PROGRESS")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#10b981",
                color: "#ffffff",
                border: "none",
                fontWeight: 800,
                fontSize: "12.5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>I Have Arrived at Location</span>
              <ArrowRight size={14} />
            </button>
          )}

          {job.stage === "IN_PROGRESS" && (
            <button
              onClick={() => onAdvanceStage(job.id, "COMPLETED")}
              style={{
                padding: "8px 18px",
                backgroundColor: "#10b981",
                color: "#ffffff",
                border: "none",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CheckCircle size={15} />
              <span>Mark Job Finished & Collect Payment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
