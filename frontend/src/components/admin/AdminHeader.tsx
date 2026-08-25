"use client";

import React from "react";
import { ShieldCheck, Sun, Moon, Lock, Activity, Layers } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface AdminHeaderProps {
  activeDistrictCount?: number;
  totalResolutions?: number;
}

export function AdminHeader({
  activeDistrictCount = 18,
  totalResolutions = 96.4,
}: AdminHeaderProps) {
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
      {/* Left: Platform Admin Operations Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            backgroundColor: "rgba(8,145,178,0.1)",
            border: "1.5px solid var(--accent)",
            fontSize: "12px",
            fontWeight: 800,
            color: "var(--accent)",
            letterSpacing: "0.04em",
          }}
        >
          <Layers size={14} />
          <span>Platform Operations & Quality Control</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
          <Activity size={14} color="#10b981" />
          <span>{activeDistrictCount} Service Hubs Active · {totalResolutions}% Job Completion Rate</span>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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

        {/* Administrator Profile Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            paddingLeft: "12px",
            borderLeft: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "var(--accent)",
              color: "var(--accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "14px",
            }}
          >
            AD
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
              Platform Operations
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>
              Super Admin Manager
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
