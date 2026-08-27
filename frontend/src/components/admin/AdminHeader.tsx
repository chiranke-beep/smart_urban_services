"use client";

import React from "react";
import { ShieldCheck, Sun, Moon, Lock, Activity, Layers, LogOut, Menu } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";

interface AdminHeaderProps {
  activeDistrictCount?: number;
  totalResolutions?: number;
  onToggleMobileMenu?: () => void;
}

export function AdminHeader({
  activeDistrictCount = 18,
  totalResolutions = 96.4,
  onToggleMobileMenu,
}: AdminHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const isDark = theme === "dark";

  return (
    <header
      style={{
        height: "68px",
        padding: "0 20px",
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
      {/* Left: Platform Admin Operations Badge & Hamburger */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            aria-label="Open menu"
            className="mobile-only"
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              cursor: "pointer",
              padding: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>
        )}

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
          <span>Admin Operations</span>
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
          <div className="desktop-only">
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
              {user?.fullName || "Platform Operations"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {user?.staffId ? `Staff ID: ${user.staffId}` : "Super Admin Manager"}
            </div>
          </div>

          {/* Quick Sign Out Action */}
          <button
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
