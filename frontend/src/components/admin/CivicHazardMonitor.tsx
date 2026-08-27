"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
  Truck,
  Zap,
  ArrowRight,
  Radio,
} from "lucide-react";
import { CivicHazardIncident } from "@/types/admin";
import { formatRelativeTime } from "@/utils/formatters";
import { useTheme } from "@/components/ThemeProvider";

interface CivicHazardMonitorProps {
  hazards: CivicHazardIncident[];
  onDispatchCrew: (hazardId: string, crewName: string) => void;
}

export function CivicHazardMonitor({
  hazards,
  onDispatchCrew,
}: CivicHazardMonitorProps) {
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);
  const [crewName, setCrewName] = useState("Sunil Kumara Rig (WP-ABX-8821)");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleDispatch = (hazardId: string) => {
    onDispatchCrew(hazardId, crewName);
    setSelectedHazardId(null);
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
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Community Hazard Alerts & Emergency Dispatch ({hazards.length})
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
          Urgent property and neighborhood hazard reports requiring rapid technician intervention
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {hazards.map((haz) => {
          const isCritical = haz.urgency === "CRITICAL";
          const isDispatched = haz.status === "DISPATCHED";
          const isResolved = haz.status === "RESOLVED";

          return (
            <div
              key={haz.id}
              style={{
                padding: "22px 24px",
                backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                border: isCritical
                  ? "1.5px solid #ef4444"
                  : isDispatched
                  ? "1.5px solid var(--accent)"
                  : "1px solid var(--border)",
                boxShadow: isCritical ? "0 4px 18px rgba(239,68,68,0.15)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* Header: Urgency, Category, Status */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      backgroundColor: isCritical ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                      color: isCritical ? "#ff6b6b" : "#f59e0b",
                      border: `1px solid ${isCritical ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                      fontSize: "12px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>{haz.urgency} PRIORITY</span>
                  </span>

                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 700 }}>
                    #{haz.id} · Reported {formatRelativeTime(haz.reportedAt)}
                  </span>
                </div>

                {/* High Contrast Status Badges for Light & Dark Mode */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      padding: "5px 14px",
                      backgroundColor: isResolved
                        ? "rgba(16,185,129,0.15)"
                        : isDispatched
                        ? "rgba(6,182,212,0.15)"
                        : "rgba(239,68,68,0.18)",
                      color: isResolved ? "#10b981" : isDispatched ? "#06b6d4" : "#ff4d4d",
                      border: `1px solid ${
                        isResolved
                          ? "rgba(16,185,129,0.4)"
                          : isDispatched
                          ? "rgba(6,182,212,0.4)"
                          : "rgba(239,68,68,0.4)"
                      }`,
                      fontSize: "12px",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                    }}
                  >
                    STATUS: {haz.status}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 style={{ fontSize: "17.5px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px 0" }}>
                  {haz.title}
                </h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  {haz.description}
                </p>
              </div>

              {/* Location & Assigned Crew Details */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "14px",
                  paddingTop: "12px",
                  borderTop: "1px dashed var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12.5px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 700, color: "var(--text-primary)" }}>
                    <MapPin size={14} color="var(--accent)" />
                    <span>{haz.locality}, {haz.district}</span>
                  </span>

                  {haz.assignedCrew && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10b981", fontWeight: 700 }}>
                      <Truck size={14} />
                      <span>Crew: {haz.assignedCrew}</span>
                    </span>
                  )}
                </div>

                {/* Dispatch Button if Open */}
                {haz.status === "OPEN" && (
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    {selectedHazardId === haz.id ? (
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <select
                          value={crewName}
                          onChange={(e) => setCrewName(e.target.value)}
                          style={{
                            padding: "8px 12px",
                            backgroundColor: isDark ? "#0f172a" : "#ffffff",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            outline: "none",
                            maxWidth: "100%",
                          }}
                        >
                          <option value="Sunil Kumara Rig (WP-ABX-8821)">Sunil Kumara Rig (Maharagama)</option>
                          <option value="Rohan Jayasuriya Plumbing Squad">Rohan Jayasuriya Squad (Kelaniya)</option>
                          <option value="Asanka Bandara Clearing Unit">Asanka Bandara Unit (Kandy)</option>
                        </select>

                        <button
                          onClick={() => handleDispatch(haz.id)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "var(--accent)",
                            color: "var(--accent-text)",
                            border: "none",
                            fontWeight: 800,
                            fontSize: "12.5px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Confirm Dispatch
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedHazardId(haz.id)}
                        style={{
                          padding: "9px 18px",
                          backgroundColor: "var(--accent)",
                          color: "var(--accent-text)",
                          border: "none",
                          fontWeight: 800,
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                          transition: "transform 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                      >
                        <Zap size={14} />
                        <span>Dispatch Local Worker Crew</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
