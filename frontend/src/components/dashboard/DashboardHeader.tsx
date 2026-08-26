"use client";

import React from "react";
import { Search, MapPin, Sun, Moon, Bell, ShieldCheck } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface DashboardHeaderProps {
  selectedLocality: string;
  onChangeLocality: (loc: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function DashboardHeader({
  selectedLocality,
  onChangeLocality,
  searchQuery,
  onSearchChange,
}: DashboardHeaderProps) {
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
      {/* Left: Search input */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "420px" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              color: "var(--text-secondary)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search workers, jobs, localities (e.g. Tree cutting, Maharagama)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              borderRadius: "0px",
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: "13.5px",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Locality Selector Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            backgroundColor: isDark ? "rgba(66,214,255,0.08)" : "rgba(8,145,178,0.08)",
            border: "1px solid var(--border)",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--accent)",
          }}
        >
          <MapPin size={15} />
          <span>{selectedLocality} · Western Province</span>
        </div>

        {/* Live Network Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#10b981",
            padding: "6px 12px",
            backgroundColor: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              boxShadow: "0 0 8px #10b981",
            }}
          />
          <span>Radar Live</span>
        </div>

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

        {/* User profile avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            paddingLeft: "8px",
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
              fontWeight: 800,
              fontSize: "14px",
            }}
          >
            HO
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
              Homeowner
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Verified Resident
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
