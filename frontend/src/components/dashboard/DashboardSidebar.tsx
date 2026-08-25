"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  History,
  ShieldCheck,
  Home,
  Plus,
} from "lucide-react";

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPostJob: () => void;
  unreadChatCount?: number;
  activeJobsCount?: number;
}

export function DashboardSidebar({
  activeTab,
  setActiveTab,
  onOpenPostJob,
  unreadChatCount = 0,
  activeJobsCount = 1,
}: DashboardSidebarProps) {
  const navItems = [
    { id: "active", label: "Active Orders & Live GPS", icon: ClipboardList, badge: activeJobsCount },
    { id: "chat", label: "Worker Chat Hub", icon: MessageSquare, badge: unreadChatCount },
    { id: "history", label: "Payments & Job History", icon: History },
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
              backgroundColor: "var(--accent)",
              color: "var(--accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "16px",
            }}
          >
            SU
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Smart Urban<span style={{ color: "var(--accent)" }}>.</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Citizen Portal
            </div>
          </div>
        </Link>

        {/* Quick Action Button */}
        <button
          onClick={onOpenPostJob}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "0px",
            backgroundColor: "var(--accent)",
            color: "var(--accent-text)",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "13.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 16px var(--accent-glow)",
            transition: "transform 0.2s ease",
            marginBottom: "24px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Post New Job Request</span>
        </button>

        {/* Navigation Items */}
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
                    ? "rgba(66, 214, 255, 0.12)"
                    : "transparent",
                  borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                  borderTop: "none",
                  borderRight: "none",
                  borderBottom: "none",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "14px",
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
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-text)",
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

      {/* Bottom info & Return Home */}
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
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <Home size={16} />
          <span>Back to Landing</span>
        </Link>
      </div>
    </aside>
  );
}
