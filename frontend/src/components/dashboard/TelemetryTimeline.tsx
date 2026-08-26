"use client";

import React from "react";
import { Check, Clock, Radio, Truck, Wrench, ShieldCheck } from "lucide-react";
import { DispatchStage } from "@/types/job";
import { DISPATCH_STAGES_FLOW } from "@/utils/constants";

interface TelemetryTimelineProps {
  currentStage: DispatchStage;
  etaMinutes?: number;
}

export function TelemetryTimeline({ currentStage, etaMinutes }: TelemetryTimelineProps) {
  const stageKeys = ["REQUESTED", "QUOTED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED"];
  const currentIndex = stageKeys.indexOf(currentStage);

  const getStageIcon = (key: string, isDone: boolean, isCurrent: boolean) => {
    if (isDone) return <Check size={14} strokeWidth={3} />;
    if (key === "EN_ROUTE") return <Truck size={14} />;
    if (key === "IN_PROGRESS") return <Wrench size={14} />;
    if (key === "COMPLETED") return <ShieldCheck size={14} />;
    return <Clock size={14} />;
  };

  return (
    <div style={{ width: "100%", padding: "20px 0 10px" }}>
      {/* Progress Bar Container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${stageKeys.length}, 1fr)`,
          position: "relative",
          gap: "8px",
        }}
      >
        {stageKeys.map((key, idx) => {
          const isDone = idx < currentIndex || currentStage === "COMPLETED";
          const isCurrent = idx === currentIndex && currentStage !== "COMPLETED";
          const stageInfo = DISPATCH_STAGES_FLOW.find((s) => s.key === key);

          return (
            <div
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                position: "relative",
              }}
            >
              {/* Step indicator bar */}
              <div
                style={{
                  height: "5px",
                  backgroundColor: isDone || isCurrent
                    ? isCurrent
                      ? "var(--accent)"
                      : "#10b981"
                    : "rgba(128,128,128,0.2)",
                  boxShadow: isCurrent ? "0 0 10px var(--accent-glow)" : "none",
                  transition: "all 0.4s ease",
                }}
              />

              {/* Step Label & Icon */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "0px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDone
                      ? "#10b981"
                      : isCurrent
                      ? "var(--accent)"
                      : "rgba(128,128,128,0.15)",
                    color: isDone
                      ? "#ffffff"
                      : isCurrent
                      ? "var(--accent-text)"
                      : "var(--text-secondary)",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  {getStageIcon(key, isDone, isCurrent)}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent
                        ? "var(--accent)"
                        : isDone
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {stageInfo?.label || key}
                  </div>
                  {isCurrent && key === "EN_ROUTE" && (
                    <div style={{ fontSize: "10.5px", color: "#10b981", fontWeight: 700 }}>
                      ETA ~{etaMinutes}m
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
