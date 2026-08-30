"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Home,
  MapPin,
  Clock,
  ShieldCheck,
  Paintbrush,
  Trees,
  Wrench,
  Laptop,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/api";

interface Review {
  id: string;
  author: string;
  location: string;
  trade: string;
  tradeIcon: React.ElementType;
  tradeColor: string;
  workerName: string;
  rating: number;
  date: string;
  text: string;
  cost: string;
  timeTaken: string;
  likes: number;
  verified: boolean;
}

const TRADE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  painting: { label: "Home Painting", icon: Paintbrush, color: "#f97316" },
  "tree-cutting": { label: "Tree & Yard Care", icon: Trees, color: "#10b981" },
  plumbing: { label: "Plumbing Service", icon: Wrench, color: "#06b6d4" },
  cleaning: { label: "Roof & Clean", icon: Home, color: "#3b82f6" },
  "pc-repair": { label: "PC & Laptop Repair", icon: Laptop, color: "#8b5cf6" },
  odd_jobs: { label: "Masonry & Handyman", icon: Wrench, color: "#d97706" },
};

export function CommunityReviews() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    // Fetch live community reviews from PostgreSQL database
    apiClient<{ success: boolean; data?: any[] }>("/reviews")
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const liveReviews: Review[] = res.data.map((r) => {
            const catKey = (r.category || "").toLowerCase();
            const matchedKey = Object.keys(TRADE_CONFIG).find((k) => catKey.includes(k)) || "tree-cutting";
            const cfg = TRADE_CONFIG[matchedKey] || TRADE_CONFIG["tree-cutting"];

            return {
              id: `rev-${r.id}`,
              author: r.author || "Verified Homeowner",
              location: r.location || "Colombo",
              trade: cfg.label,
              tradeIcon: cfg.icon,
              tradeColor: cfg.color,
              workerName: r.worker_name || "Verified Specialist",
              rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
              date: "Recently Verified",
              text: r.comment || "Service delivered smoothly with transparent direct settlement.",
              cost: `Rs. ${Number(r.cost_lkr || 2800).toLocaleString()}`,
              timeTaken: "Direct Settlement",
              likes: Number(r.likes || 0),
              verified: true,
            };
          });

          setReviews(liveReviews);
        } else {
          setReviews([]);
        }
      })
      .catch((err) => {
        console.warn("[DB Reviews load notice]:", err.message);
        setReviews([]);
      })
      .finally(() => setIsLoading(false));

    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".review-card-anim",
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleLike = (id: string) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const rawId = id.replace("rev-", "");
    const currentlyLiked = !!likedIds[id];
    setLikedIds((prev) => ({ ...prev, [id]: !currentlyLiked }));

    apiClient<{ success: boolean; likes: number; isLiked: boolean }>(`/reviews/${rawId}/like`, {
      method: "POST",
      body: JSON.stringify({ userId: user?.id }),
    })
      .then((res) => {
        if (res && typeof res.likes === "number") {
          setReviews((prev) =>
            prev.map((r) => (r.id === id ? { ...r, likes: res.likes } : r))
          );
          setLikedIds((prev) => ({ ...prev, [id]: res.isLiked }));
        }
      })
      .catch((err) => {
        console.warn("[Like error]:", err.message);
      });
  };

  return (
    <section
      ref={containerRef}
      id="reviews"
      style={{
        position: "relative",
        width: "100%",
        padding: "clamp(48px, 6vw, 100px) clamp(16px, 4vw, 48px) clamp(60px, 8vw, 120px)",
        backgroundColor: "var(--bg)",
        borderTop: "1px solid var(--border)",
        transition: "background-color 0.4s ease",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", zIndex: 1, width: "100%", margin: "0 auto" }}>

        {/* ── Section Header ────────────────────────────────────── */}
        <div style={{ maxWidth: "800px", marginBottom: "36px" }}>
          <div
            className="service-header-anim"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "0px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card-bg)",
              backdropFilter: "blur(12px)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "16px",
            }}
          >
            <ShieldCheck size={14} />
            <span>Community Trust & Verified Reviews</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(2rem, 3.8vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Real Feedback from Real Neighborhoods.
          </h2>

          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
            }}
          >
            Every review is tied to a verified on-platform job. See how local homeowners across
            Sri Lanka are empowering skilled village workers, painters, plumbers, and PC technicians.
          </p>
        </div>

        {/* ── Review Cards Grid (3 Columns) ─────────────────────── */}
        {reviews.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              border: "1px dashed var(--border)",
              backgroundColor: "var(--card-bg)",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <ShieldCheck size={40} color="#10b981" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>
              No Community Reviews Yet
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
              Real community ratings and testimonials are published automatically as soon as registered homeowners and service providers complete and verify dispatches on the platform.
            </p>
            <button
              onClick={() => router.push(isAuthenticated ? "/citizen/dashboard" : "/login")}
              style={{
                padding: "10px 22px",
                backgroundColor: "var(--accent)",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Post First Job Request →
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
              gap: "20px",
            }}
          >
            {reviews.map((rev) => {
              const Icon = rev.tradeIcon;
              const isLiked = !!likedIds[rev.id];
              const authorInitials = (rev.author || "Homeowner")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={rev.id}
                  className="review-card-anim"
                  style={{
                    position: "relative",
                    padding: "24px",
                    borderRadius: "0px",
                    backgroundColor: isDark ? "rgba(18, 24, 38, 0.85)" : "rgba(255, 255, 255, 0.95)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    backdropFilter: "blur(16px)",
                    transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = isDark
                      ? "0 16px 32px -8px rgba(0,0,0,0.5)"
                      : "0 16px 32px -8px rgba(15,23,42,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div>
                    {/* Top Row: Real Citizen Author Information */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "16px",
                        paddingBottom: "14px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "var(--accent)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "13px",
                            flexShrink: 0,
                          }}
                        >
                          {authorInitials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ fontSize: "14.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                              {rev.author}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center" }} title="Verified Homeowner">
                              <CheckCircle2 size={14} color="#10b981" />
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
                            <MapPin size={11} color="var(--accent)" />
                            <span>{rev.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Trade Badge */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 10px",
                          backgroundColor: `${rev.tradeColor}15`,
                          border: `1px solid ${rev.tradeColor}40`,
                          color: rev.tradeColor,
                          fontSize: "11.5px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={12} />
                        <span>{rev.trade}</span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "12px" }}>
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <Star
                          key={starVal}
                          size={15}
                          fill={starVal <= (rev.rating || 5) ? "#eab308" : "none"}
                          color={starVal <= (rev.rating || 5) ? "#eab308" : (isDark ? "#475569" : "#cbd5e1")}
                        />
                      ))}
                      <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--text-primary)", marginLeft: "4px" }}>
                        {(rev.rating || 5).toFixed(1)}
                      </span>
                    </div>

                    {/* Review Text / Comment Written by the Citizen */}
                    <p
                      style={{
                        fontSize: "14.5px",
                        lineHeight: 1.6,
                        color: "var(--text-primary)",
                        marginBottom: "16px",
                        fontStyle: "italic",
                      }}
                    >
                      “{rev.text}”
                    </p>

                    {/* Hired Specialist Details Pill */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        border: "1px solid var(--border)",
                        fontSize: "12.5px",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ color: "var(--text-secondary)" }}>
                        Specialist: <strong style={{ color: "var(--text-primary)" }}>{rev.workerName}</strong>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--accent)" }}>
                        {rev.cost}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: Borderless Thumbs Up Like Button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                      {rev.date}
                    </span>

                    <button
                      onClick={() => handleLike(rev.id)}
                      title={isAuthenticated ? "Like this review" : "Log in to like review"}
                      style={{
                        background: "none",
                        border: "none",
                        outline: "none",
                        color: isLiked ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        transition: "color 0.2s ease, transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <ThumbsUp size={15} fill={isLiked ? "var(--accent)" : "none"} />
                      <span>{rev.likes || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
