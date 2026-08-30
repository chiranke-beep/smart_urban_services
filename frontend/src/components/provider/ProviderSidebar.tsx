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
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ProviderSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  incomingCount?: number;
  activeJobsCount?: number;
  unreadChatCount?: number;
  isOnline: boolean;
  onToggleOnline: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function ProviderSidebar({
  activeTab,
  setActiveTab,
  incomingCount = 2,
  activeJobsCount = 1,
  unreadChatCount = 0,
  isOnline,
  onToggleOnline,
  isOpenMobile = false,
  onCloseMobile,
}: ProviderSidebarProps) {
  const { logout } = useAuth();
  const navItems = [
    {
      id: "feed",
      label: "New Requests",
      icon: Radio,
      badge: isOnline ? incomingCount : undefined,
    },
    {
      id: "active",
      label: "Active Job & Map",
      icon: Navigation,
      badge: activeJobsCount,
    },
    {
      id: "chat",
      label: "Customer Messages",
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
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 90,
          }}
          className="mobile-only"
        />
      )}

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
          zIndex: 95,
          flexShrink: 0,
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={`provider-sidebar ${isOpenMobile ? "mobile-drawer-open" : ""}`}
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "17px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              Smart Urban<span style={{ color: "#10b981" }}>.</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>
              Worker Dispatch Portal
            </div>
          </div>
        </Link>

        {/* Nav Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "16px" }}>
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

      {/* Bottom Return Link & Logout */}
      <div style={{ paddingTop: "14px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "4px" }}>
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

        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#ef4444",
            fontSize: "13px",
            background: "none",
            border: "none",
            padding: "8px 12px",
            fontWeight: 700,
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
