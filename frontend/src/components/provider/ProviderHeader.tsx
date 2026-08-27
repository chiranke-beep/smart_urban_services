import React, { useState, useEffect } from "react";
import { Search, MapPin, Sun, Moon, ShieldCheck, Star, Truck, LogOut, User } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { apiClient } from "@/services/api";

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
  workerName,
  workerTrade,
  workerRating,
  workerReviews,
}: ProviderHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const isDark = theme === "dark";
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [liveRating, setLiveRating] = useState<number>(workerRating || 5.0);
  const [liveReviews, setLiveReviews] = useState<number>(workerReviews || 0);

  const numericId = user?.id ? String(user.id).replace(/\D/g, "") : "1";

  const fetchLiveStats = () => {
    if (numericId) {
      apiClient<{ success: boolean; data?: any }>(`/providers/${numericId}/stats`)
        .then((res) => {
          if (res?.data) {
            setLiveRating(Number(res.data.rating || 5.0));
            setLiveReviews(Number(res.data.reviewCount || 0));
          }
        })
        .catch((err) => console.warn("[Live stats notice]:", err.message));
    }
  };

  useEffect(() => {
    fetchLiveStats();
  }, [numericId]);

  const displayName = workerName || user?.fullName || "Service Provider";
  const displayTrade = workerTrade || user?.trade || "Verified Technician";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
      {/* Left: Clean Brand / Subtitle */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
          Worker Dashboard
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

        {/* Worker Profile Card (Clickable to open profile) */}
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
            onClick={() => setIsProfileOpen(true)}
            title="Click to view/edit profile and address"
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
                width: "38px",
                height: "38px",
                backgroundColor: "#10b981",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "15px",
                borderRadius: "50%",
                overflow: "hidden",
              }}
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Avatar"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {displayName}
                </span>
                <span title="National ID & Trade Verified">
                  <ShieldCheck size={16} color="#10b981" />
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                <span style={{ color: "#eab308", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                  <Star size={11} fill="#eab308" />
                  {liveRating.toFixed(1)} ({liveReviews})
                </span>
                <span>· {displayTrade}</span>
              </div>
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

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={fetchLiveStats}
      />
    </header>
  );
}
