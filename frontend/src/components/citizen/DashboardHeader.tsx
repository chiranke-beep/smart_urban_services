import React, { useState, useEffect } from "react";
import { MapPin, Sun, Moon, Bell, ShieldCheck, LogOut, User, Menu } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { apiClient } from "@/services/api";

interface DashboardHeaderProps {
  selectedLocality: string;
  onChangeLocality: (loc: string) => void;
  onToggleMobileMenu?: () => void;
}

export function DashboardHeader({
  selectedLocality,
  onChangeLocality,
  onToggleMobileMenu,
}: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const isDark = theme === "dark";
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [liveProfilePic, setLiveProfilePic] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const numericId = user?.id ? String(user.id).replace(/\D/g, "") : "1";

  const fetchLiveProfile = () => {
    if (numericId) {
      apiClient<{ success: boolean; data?: any }>(`/users/profile/${numericId}`)
        .then((res) => {
          if (res?.data?.profilePicture) {
            setLiveProfilePic(res.data.profilePicture);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchLiveProfile();
  }, [numericId]);

  useEffect(() => {
    setImgError(false);
  }, [user?.profilePicture, liveProfilePic]);

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "HO";

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
      {/* Left: Mobile Hamburger & Citizen Portal Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flexShrink: 0 }}>
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
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            Citizen Portal
          </span>
          <span className="desktop-only" style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 6px", backgroundColor: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "2px", whiteSpace: "nowrap" }}>
            Live Dispatch
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-primary)",
            cursor: "pointer",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15) rotate(15deg)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) rotate(0deg)")}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User profile avatar (Clickable to open profile) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingLeft: "6px",
            borderLeft: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            onClick={() => setIsProfileOpen(true)}
            title="Click to view/edit profile and saved home address"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
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
                borderRadius: "50%",
                overflow: "hidden",
              }}
            >
              {(liveProfilePic || user?.profilePicture) && !imgError ? (
                <img
                  src={liveProfilePic || user?.profilePicture}
                  alt="Avatar"
                  onError={() => setImgError(true)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>
            <div className="desktop-only" style={{ minWidth: 0, maxWidth: "clamp(90px, 24vw, 220px)", overflow: "hidden" }}>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.fullName || "Citizen"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.homeAddress ? user.homeAddress.split(",")[0] : (user?.locality ? `${user.locality}, ${user.district || ""}` : selectedLocality || "Colombo")}
              </div>
            </div>
          </div>

          {/* Prominent Sign Out Action */}
          <button
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
            style={{
              backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#ef4444",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "0px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              fontWeight: 800,
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2";
              e.currentTarget.style.color = "#ef4444";
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={fetchLiveProfile}
      />
    </header>
  );
}
