"use client";

import React from "react";
import Link from "next/link";
import {
  Radio,
  Navigation,
  MessageSquare,
  Wallet,
  Home,
  ShieldCheck,
  Power,
  Sliders,
} from "lucide-react";

interface ProviderSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  incomingCount?: number;
  activeJobsCount?: number;
  unreadChatCount?: number;
  isOnline: boolean;
  onToggleOnline: () => void;
}

export function ProviderSidebar({
  activeTab,
  setActiveTab,
  incomingCount = 2,
  activeJobsCount = 1,
  unreadChatCount = 0,
  isOnline,
  onToggleOnline,
}: ProviderSidebarProps) {
  const navItems = [
    {
      id: "feed",
      label: "Broadcast Feed",
      icon: Radio,
      badge: isOnline ? incomingCount : undefined,
    },
    {
      id: "active",
      label: "Active Job & GPS Route",
      icon: Navigation,
      badge: activeJobsCount,
    },
    {
      id: "chat",
      label: "Homeowner Chat Hub",
      icon: MessageSquare,
      badge: unreadChatCount,
    },
    {
      id: "earnings",
      label: "Earnings & Reviews",
      icon: Wallet,
    },
  ];

  return (
    <aside
      style={{
        width: "260px",
        height: "100vh",
        position: "sticky",
        top: 0,
        backgroundColor: "var(--card-bg)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px 16px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      <div>
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px 24px",
            textDecoration: "none",
            borderBottom: "1px solid var(--border)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#10b981",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "16px",
            }}
          >
            WK
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Smart Urban<span style={{ color: "#10b981" }}>.</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Worker Dispatch Portal
            </div>
          </div>
        </Link>

        {/* Online / Offline Availability Switch */}
        <button
          onClick={onToggleOnline}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "0px",
            backgroundColor: isOnline ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
            border: isOnline ? "1.5px solid #10b981" : "1.5px solid var(--border)",
            color: isOnline ? "#10b981" : "var(--text-secondary)",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            transition: "all 0.2s ease",
            fontFamily: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: isOnline ? "#10b981" : "#94a3b8",
                boxShadow: isOnline ? "0 0 10px #10b981" : "none",
              }}
            />
            <span>{isOnline ? "ONLINE · RADAR ON" : "OFFLINE"}</span>
          </div>
          <Power size={15} />
        </button>

        {/* Nav Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "0px",
                  backgroundColor: isActive
                    ? "rgba(16, 185, 129, 0.12)"
                    : "transparent",
                  borderLeft: isActive ? "3px solid #10b981" : "3px solid transparent",
                  borderTop: "none",
                  borderRight: "none",
                  borderBottom: "none",
                  color: isActive ? "#10b981" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: "13.5px",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 7px",
                      backgroundColor: "#10b981",
                      color: "#ffffff",
                      fontWeight: 800,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Return Link */}
      <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-secondary)",
            fontSize: "13px",
            textDecoration: "none",
            padding: "8px 12px",
            fontWeight: 600,
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <Home size={16} />
          <span>Back to Landing</span>
        </Link>
      </div>
    </aside>
  );
}
