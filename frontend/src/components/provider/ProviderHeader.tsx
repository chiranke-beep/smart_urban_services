"use client";

import React from "react";
import { Search, MapPin, Sun, Moon, ShieldCheck, Star, Truck } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface ProviderHeaderProps {
  selectedLocality: string;
  isOnline: boolean;
  workerName?: string;
  workerTrade?: string;
  workerRating?: number;
  workerReviews?: number;
}

export function ProviderHeader({
  selectedLocality,
  isOnline,
  workerName = "Sunil Kumara",
  workerTrade = "Master Tree Climber & Yard Care",
  workerRating = 4.9,
  workerReviews = 142,
}: ProviderHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header
      style={{
        height: "68px",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "var(--card-bg)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left: Dispatch Area Pill */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.25)",
            fontSize: "13px",
            fontWeight: 700,
            color: "#10b981",
          }}
        >
          <MapPin size={15} />
          <span>Active Dispatch Radius: {selectedLocality} · 10 km Area</span>
        </div>

        {/* Live Status indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 800,
            color: isOnline ? "#10b981" : "#94a3b8",
            padding: "6px 12px",
            backgroundColor: isOnline ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.1)",
            border: `1px solid ${isOnline ? "rgba(16,185,129,0.3)" : "rgba(100,116,139,0.2)"}`,
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: isOnline ? "#10b981" : "#94a3b8",
              boxShadow: isOnline ? "0 0 8px #10b981" : "none",
            }}
          />
          <span>{isOnline ? "BROADCAST RECEIVER ON" : "BROADCAST PAUSED"}</span>
        </div>
      </div>

      {/* Right: Worker Profile & Theme Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-primary)",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15) rotate(15deg)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) rotate(0deg)")}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Worker Profile Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            paddingLeft: "12px",
            borderLeft: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              backgroundColor: "#10b981",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "15px",
            }}
          >
            SK
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
                {workerName}
              </span>
              <span title="National ID & Trade Verified">
                <ShieldCheck size={16} color="#10b981" />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
              <span style={{ color: "#eab308", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                <Star size={11} fill="#eab308" />
                {workerRating} ({workerReviews})
              </span>
              <span>· Three-Wheeler WP-ABX-8821</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
