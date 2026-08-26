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
}

export function ActiveDispatchCard({
  job,
  onOpenChat,
  onAdvanceStage,
}: ActiveDispatchCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const worker = job.assignedWorker;

  return (
    <div
      style={{
        padding: "28px",
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
            LIVE DISPATCH ACTIVE
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>
            #{job.id}
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

      {/* 5-Stage Telemetry Timeline */}
      <TelemetryTimeline currentStage={job.stage} etaMinutes={job.etaMinutes} />

      {/* Live GPS Route Tracker Mini-Map (When En Route or In Progress) */}
      {(job.stage === "EN_ROUTE" || job.stage === "IN_PROGRESS") && worker && (
        <LiveGpsRouteMap
          workerName={worker.name}
          vehiclePlate={worker.plateNumber}
          locality={job.locality}
          etaMinutes={job.etaMinutes}
          stage={job.stage}
          onGeofenceArrival={() => {
            if (onAdvanceStage) {
              onAdvanceStage(job.id, "IN_PROGRESS");
            }
          }}
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
            <strong>Geofence AI Verified Arrival:</strong> {worker?.name} has arrived at property perimeter (&lt;50m). Task is actively in progress.
          </span>
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
                {worker.vehicleType && (
                  <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Truck size={13} />
                    {worker.plateNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rate & Interactive Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {job.quotation && (
              <div style={{ textAlign: "right", paddingRight: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                  Approved Quote
                </div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)" }}>
                  {formatCurrency(job.quotation.amountLKR)}
                </div>
              </div>
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
              <span>Open Worker Chat</span>
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

      {/* Interactive Simulation Controls (Examiner / Degree Demonstration) */}
      {onAdvanceStage && job.stage !== "COMPLETED" && (
        <div
          style={{
            marginTop: "16px",
            padding: "10px 14px",
            backgroundColor: "rgba(66,214,255,0.06)",
            border: "1px dashed var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
            <Sliders size={13} color="var(--accent)" />
            <span><strong>Simulation Pipeline:</strong> Advance stage to test worker arrival & completion:</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {job.stage === "EN_ROUTE" && (
              <button
                onClick={() => onAdvanceStage(job.id, "IN_PROGRESS")}
                style={{
                  padding: "4px 10px",
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>Mark as Arrived / In Progress</span>
                <ArrowRight size={12} />
              </button>
            )}
            {job.stage === "IN_PROGRESS" && (
              <button
                onClick={() => onAdvanceStage(job.id, "COMPLETED")}
                style={{
                  padding: "4px 10px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <CheckCircle size={12} />
                <span>Mark as Completed</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
