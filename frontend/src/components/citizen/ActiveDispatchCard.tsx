"use client";

import React from "react";
import {
  PhoneCall,
  MessageSquare,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  CheckCircle,
  Truck,
  ArrowRight,
  ExternalLink,
  Sliders,
  Radio,
} from "lucide-react";
import { JobRequest } from "@/types/job";
import { TelemetryTimeline } from "./TelemetryTimeline";
import { LiveGpsRouteMap } from "./LiveGpsRouteMap";
import { formatCurrency, formatETA } from "@/utils/formatters";
import { useTheme } from "@/components/ThemeProvider";

interface ActiveDispatchCardProps {
  job: JobRequest;
  onOpenChat: (jobId: string) => void;
  onAdvanceStage?: (jobId: string, stage: JobRequest["stage"]) => void;
  onCancelJob?: (jobId: string) => void;
  onAcceptQuote?: (jobId: string) => void;
}

export function ActiveDispatchCard({
  job,
  onOpenChat,
  onAdvanceStage,
  onCancelJob,
  onAcceptQuote,
}: ActiveDispatchCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const worker = job.assignedWorker;

  return (
    <div
      style={{
        padding: "clamp(16px, 3.5vw, 28px)",
        borderRadius: "0px",
        backgroundColor: "var(--card-bg)",
        border: "1.5px solid var(--accent)",
        boxShadow: "0 16px 36px -10px var(--accent-glow)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top Banner: Status + Job ID */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
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
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981", borderRadius: "50%" }} />
            Active Job
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Status: {job.stage === "QUOTED" ? "Price Quoted" : job.stage === "EN_ROUTE" ? "On the way" : job.stage === "IN_PROGRESS" ? "Working" : job.stage === "COMPLETED" ? "Finished" : "Requested"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <MapPin size={14} color="var(--accent)" />
          <span style={{ fontWeight: 600 }}>{job.locality}, {job.district}</span>
        </div>
      </div>

      {/* Main Job Title & Description */}
      <div style={{ marginBottom: "20px" }}>
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
        <p style={{ fontSize: "14.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {job.description}
        </p>
      </div>

      {/* Stage Telemetry Step Bar */}
      <TelemetryTimeline currentStage={job.stage} etaMinutes={job.etaMinutes || 15} />

      {/* Quotation Received & Price Confirmation Banner (when QUOTED) */}
      {(job.stage === "QUOTED" && job.quotation && job.quotation.status === "pending") && (
        <div
          style={{
            marginTop: "20px",
            padding: "18px 22px",
            backgroundColor: "rgba(16,185,129,0.1)",
            border: "2px solid #10b981",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 800 }}>
              Worker Sent Price Quote
            </div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#10b981", marginTop: "2px" }}>
              {formatCurrency(job.quotation?.amountLKR || job.costLKR || 3500)}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Review the price. You can accept to start, chat to negotiate, or decline.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            {onAcceptQuote && (
              <button
                onClick={() => onAcceptQuote(job.id)}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
                }}
              >
                <CheckCircle size={16} />
                <span>Accept Price & Start</span>
              </button>
            )}

            <button
              onClick={() => onOpenChat(job.id)}
              style={{
                padding: "10px 16px",
                backgroundColor: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <MessageSquare size={15} />
              <span>Chat to Negotiate</span>
            </button>

            {onCancelJob && (
              <button
                onClick={() => onCancelJob(job.id)}
                style={{
                  padding: "10px 14px",
                  backgroundColor: "transparent",
                  color: "#ef4444",
                  border: "1.5px solid #ef4444",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  cursor: "pointer",
                }}
              >
                Decline & Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live GPS Route Map (shown when En Route or In Progress) */}
      {(job.stage === "EN_ROUTE" || job.stage === "IN_PROGRESS") && worker && (
        <LiveGpsRouteMap
          workerName={worker.name}
          locality={job.locality}
          homeLat={job.latitude}
          homeLng={job.longitude}
          etaMinutes={job.etaMinutes || 15}
          stage={job.stage}
          isProviderView={false}
        />
      )}

      {/* Geofence Verified Banner when In Progress */}
      {job.stage === "IN_PROGRESS" && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            backgroundColor: "rgba(8,145,178,0.12)",
            border: "1.5px solid var(--accent)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--accent)",
          }}
        >
          <ShieldCheck size={18} />
          <span>
            <strong>Geofence AI Verified Arrival:</strong> {worker?.name || "Technician"} has arrived at property perimeter (&lt;50m). Task is actively in progress.
          </span>
        </div>
      )}

      {/* Broadcast Sent / Awaiting Response State */}
      {!worker && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px 20px",
            backgroundColor: "rgba(16,185,129,0.08)",
            border: "1.5px dashed #10b981",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: "#10b981",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Radio size={18} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
                Live Broadcast Sent to Local Verified Technicians
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Waiting for nearby provider acceptance in {job.locality}, {job.district}...
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {onCancelJob && (
              <button
                onClick={() => onCancelJob(job.id)}
                style={{
                  padding: "8px 14px",
                  backgroundColor: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1.5px solid #ef4444",
                  fontWeight: 800,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>Cancel Request</span>
              </button>
            )}

            <button
              onClick={() => onOpenChat(job.id)}
              style={{
                padding: "8px 16px",
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
              <MessageSquare size={14} />
              <span>Open Dispatch Channel</span>
            </button>
          </div>
        </div>
      )}

      {/* Worker Card Preview & Direct Controls */}
      {worker && (
        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
            border: "1px solid var(--border)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {/* Worker Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: worker.avatarBg,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "18px",
              }}
            >
              {worker.name.split(" ").map((n) => n[0]).join("")}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {worker.name}
                </span>
                {worker.verified && (
                  <span title="National ID & Skills Verified">
                    <ShieldCheck size={16} color="#10b981" />
                  </span>
                )}
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                {worker.trade}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#eab308", fontWeight: 700 }}>
                  <Star size={13} fill="#eab308" />
                  {worker.rating} ({worker.reviewCount})
                </span>
              </div>
            </div>
          </div>

          {/* Rate & Interactive Actions */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            {job.quotation && (
              <div style={{ textAlign: "right", paddingRight: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                  Quoted Price
                </div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)" }}>
                  {formatCurrency(job.quotation.amountLKR)}
                </div>
              </div>
            )}

            {/* Stage Status Badge */}
            {job.stage === "EN_ROUTE" && (
              <span
                style={{
                  padding: "6px 10px",
                  backgroundColor: "rgba(100,116,139,0.12)",
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "1px dashed var(--border)",
                }}
              >
                🚗 Worker on the way
              </span>
            )}
            {job.stage === "IN_PROGRESS" && (
              <span
                style={{
                  padding: "6px 10px",
                  backgroundColor: "rgba(8,145,178,0.12)",
                  color: "var(--accent)",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "1px solid var(--accent)",
                }}
              >
                🛠️ Work in progress
              </span>
            )}

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
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <MessageSquare size={16} />
              <span>Chat with Worker</span>
            </button>

            <a
              href={`tel:${worker.phone}`}
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
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <PhoneCall size={14} />
              <span>Call</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
