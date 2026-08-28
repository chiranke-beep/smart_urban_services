"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  MapPin,
  Star,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  ArrowRight,
  ShieldCheck,
  Send,
  Camera,
  X,
  Sparkles,
  Search,
  SlidersHorizontal,
  Navigation,
  Wrench,
  Trees,
  Paintbrush,
  Laptop,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { apiClient } from "@/services/api";

interface Provider {
  id: string;
  name: string;
  avatarBg: string;
  trade: string;
  tradeType: "plumbing" | "trees" | "painting" | "cleaning" | "tech";
  rating: string;
  reviewCount: number;
  distance: string;
  eta: string;
  rate: string;
  locality: string;
  verified: boolean;
  status: "available" | "busy";
  isVolunteer?: boolean;
  skills: string[];
  recentJob: string;
}

export function NearbyProvidersDeck() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<string>("all");
  const [activeChatProvider, setActiveChatProvider] = useState<Provider | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "provider"; text: string; time: string }[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [jobStatus, setJobStatus] = useState<"connecting" | "chatting" | "booked">("chatting");
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    // Fetch live service providers ranked by AI Geo-Dispatcher from PostgreSQL
    apiClient<{ success: boolean; recommendations?: any[] }>("/ai/geo-dispatch", {
      method: "POST",
      body: JSON.stringify({
        incident_lat: 6.9271,
        incident_lng: 79.8612,
        required_category: selectedTrade === "all" ? "general" : selectedTrade,
        max_radius_km: 100.0,
      }),
    })
      .then((res) => {
        if (res?.recommendations && Array.isArray(res.recommendations) && res.recommendations.length > 0) {
          const mapped: Provider[] = res.recommendations.map((p, idx) => ({
            id: `p-${p.id}`,
            name: p.name || "Verified Technician",
            avatarBg: ["#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"][idx % 5],
            trade: p.trade || "Master Craftsman",
            tradeType: (p.trade?.toLowerCase().includes("paint") ? "painting"
              : p.trade?.toLowerCase().includes("tree") ? "trees"
              : p.trade?.toLowerCase().includes("plumb") ? "plumbing"
              : p.trade?.toLowerCase().includes("tech") ? "tech"
              : "cleaning") as any,
            rating: Number(p.rating || 5.0).toFixed(1),
            reviewCount: 0,
            distance: `${p.distance_km} km away`,
            eta: `~${p.estimated_arrival_minutes} min arrival`,
            rate: `Rs. ${p.dailyRate || 3500} / day`,
            locality: `${p.locality || "Colombo"}, ${p.district || "Western Province"}`,
            verified: Boolean(p.verified),
            status: "available",
            isVolunteer: false,
            skills: ["Verified Work Standards", "Direct Cash/Bank Settlement", "Safety Equipped"],
            recentJob: p.recommended ? "⭐ #1 AI Recommended Match" : "Local Verified Specialist",
          }));
          setProviders(mapped);
        } else {
          setProviders([]);
        }
      })
      .catch((err) => {
        console.warn("[DB Providers load notice]:", err.message);
        setProviders([]);
      })
      .finally(() => setIsLoading(false));

    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".providers-header-anim",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );
      gsap.fromTo(
        ".provider-card",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power4.out", delay: 0.15 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const openChatWithProvider = (provider: Provider) => {
    setActiveChatProvider(provider);
    setJobStatus("chatting");
    setChatMessages([
      {
        sender: "provider",
        text: `Hello! I'm ${provider.name} (${provider.trade}). I'm currently ${provider.distance} (~${provider.eta}). How can I help you today?`,
        time: "Just now",
      },
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeChatProvider) return;

    const userText = inputMsg;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setChatMessages((prev) => [...prev, { sender: "user", text: userText, time: now }]);
    setInputMsg("");

    // Simulated instant reply like PickMe/Uber driver chat
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "provider",
          text: `Got it! I can be at your location in ${activeChatProvider.eta.replace("~", "")}. My standard rate is ${activeChatProvider.rate}. Would you like to confirm the booking?`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1000);
  };

  const handleConfirmBooking = () => {
    setJobStatus("booked");
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "provider",
        text: `✓ Booking Confirmed! I have received your location in ${activeChatProvider?.locality}. I am on my way now! ETA: 12 minutes.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const filteredProviders =
    selectedTrade === "all"
      ? providers
      : providers.filter((p) => p.tradeType === selectedTrade);

  return (
    <section
      ref={containerRef}
      id="workers"
      style={{
        position: "relative",
        width: "100%",
        padding: "100px 48px 120px",
        backgroundColor: "var(--bg)",
        borderTop: "1px solid var(--border)",
        transition: "background-color 0.4s ease",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", zIndex: 1, width: "100%", margin: "0 auto" }}>

        {/* ── Section Header (Uber / PickMe Model) ────────────────── */}
        <div style={{ maxWidth: "820px", marginBottom: "40px" }}>
          <div
            className="providers-header-anim"
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
            <Navigation size={14} />
            <span>On-Demand Service Dispatch · PickMe / Uber Model</span>
          </div>

          <h2
            className="providers-header-anim"
            style={{
              fontSize: "clamp(2rem, 3.8vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Nearby Available Workers & Techs.
          </h2>

          <p
            className="providers-header-anim"
            style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
            }}
          >
            See live local plumbers, painters, tree cutters, and computer technicians near your home.
            Chat directly in-app to agree on quotes and dispatch help to your doorstep.
          </p>
        </div>

        {/* ── Location Auto-Detect Bar & Filters ─────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            padding: "16px 20px",
            borderRadius: "0px",
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)",
            border: "1px solid var(--border)",
            marginBottom: "32px",
          }}
        >
          {/* Location Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "0px",
                backgroundColor: "var(--accent)",
                color: "var(--accent-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={16} />
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                Your Detected Neighborhood
              </div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
                Maharagama / Nugegoda Zone, Western Province
              </div>
            </div>
          </div>

          {/* Trade Filter Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Nearby (6)" },
              { id: "plumbing", label: "Plumbers" },
              { id: "trees", label: "Tree Cutters" },
              { id: "painting", label: "Painters" },
              { id: "cleaning", label: "Roof & Clean" },
              { id: "tech", label: "PC Techs" },
            ].map((tab) => {
              const isSelected = selectedTrade === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTrade(tab.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "0px",
                    backgroundColor: isSelected
                      ? isDark
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(15,23,42,0.9)"
                      : "transparent",
                    color: isSelected ? "#ffffff" : "var(--text-primary)",
                    border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Nearby Providers Grid (3 Columns) ─────────────────── */}
        {filteredProviders.length === 0 ? (
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
            <Wrench size={40} color="var(--accent)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>
              No Service Providers Registered in this Zone Yet
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
              All specialists shown here are verified and matched via AI Geo-Dispatch. Register your trade skills to start receiving dispatches from local homeowners.
            </p>
            <Link
              href="/provider/register"
              style={{
                display: "inline-block",
                padding: "10px 22px",
                backgroundColor: "#10b981",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Register as Service Provider →
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredProviders.map((worker) => (
            <div
              key={worker.id}
              className="provider-card"
              style={{
                position: "relative",
                padding: "24px",
                borderRadius: "0px",
                backgroundColor: isDark ? "rgba(18, 24, 38, 0.8)" : "rgba(255, 255, 255, 0.9)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backdropFilter: "blur(16px)",
                transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease, box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: "translateZ(0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px var(--accent)"
                  : "0 20px 40px -10px rgba(15,23,42,0.12), 0 0 0 1px var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div>
                {/* Header: Avatar, Name, Verified, Status */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "0px",
                        backgroundColor: worker.avatarBg,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "16px",
                      }}
                    >
                      {worker.name.split(" ").map((n) => n[0]).join("")}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
                          {worker.name}
                        </span>
                        {worker.verified && (
                          <span title="ID & Skills Verified">
                            <CheckCircle2 size={15} color="#10b981" />
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {worker.trade}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontWeight: 800,
                      color: "#eab308",
                      backgroundColor: "rgba(234, 179, 8, 0.12)",
                      padding: "4px 8px",
                      borderRadius: "0px",
                    }}
                  >
                    <Star size={12} fill="#eab308" />
                    <span>{worker.rating}</span>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>({worker.reviewCount})</span>
                  </div>
                </div>

                {/* PickMe / Uber style Proximity & Arrival Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "0px",
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    border: "1px solid var(--border)",
                    marginBottom: "16px",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontWeight: 700 }}>
                    <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981" }} />
                    <span>{worker.distance}</span>
                    <span style={{ color: "var(--text-secondary)" }}>·</span>
                    <span>{worker.eta}</span>
                  </div>

                  <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                    {worker.rate}
                  </div>
                </div>

                {/* Skills Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                  {worker.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "0px",
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Chat & Instant Dispatch */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <button
                  onClick={() => openChatWithProvider(worker)}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px 16px",
                    borderRadius: "0px",
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-text)",
                    fontSize: "13px",
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px var(--accent-glow)",
                    transition: "transform 0.2s ease",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <MessageSquare size={14} />
                  <span>In-App Chat & Dispatch</span>
                </button>

                <a
                  href={`tel:+94770000000`}
                  title="Direct Call (Alternative)"
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "0px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                >
                  <Phone size={15} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Interactive In-App Chat Modal (Uber / PickMe In-App Style) ── */}
        {activeChatProvider && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              width: "420px",
              maxHeight: "560px",
              height: "520px",
              zIndex: 1000,
              borderRadius: "0px",
              border: "1.5px solid var(--accent)",
              backgroundColor: isDark ? "rgba(10, 14, 24, 0.96)" : "#ffffff",
              boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              backdropFilter: "blur(20px)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "var(--accent)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "0px",
                    backgroundColor: activeChatProvider.avatarBg,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  {activeChatProvider.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 800 }}>
                    {activeChatProvider.name}
                  </div>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>
                    {activeChatProvider.distance} · {activeChatProvider.eta}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setActiveChatProvider(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Status Strip */}
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: jobStatus === "booked" ? "rgba(16,185,129,0.15)" : "rgba(66,214,255,0.1)",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11px",
              }}
            >
              <span style={{ color: jobStatus === "booked" ? "#10b981" : "var(--accent)", fontWeight: 700 }}>
                {jobStatus === "booked" ? "✓ DISPATCH CONFIRMED · EN ROUTE" : "DIRECT ON-PLATFORM CHAT ACTIVE"}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                {activeChatProvider.rate}
              </span>
            </div>

            {/* Chat Messages Body */}
            <div
              style={{
                flex: 1,
                padding: "16px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "0px",
                      backgroundColor:
                        msg.sender === "user"
                          ? "var(--accent)"
                          : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(15,23,42,0.06)",
                      color: msg.sender === "user" ? "#000000" : "var(--text-primary)",
                      fontSize: "12px",
                      lineHeight: 1.4,
                      fontWeight: msg.sender === "user" ? 600 : 400,
                    }}
                  >
                    {msg.text}
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      color: "var(--text-secondary)",
                      marginTop: "3px",
                      textAlign: msg.sender === "user" ? "right" : "left",
                    }}
                  >
                    {msg.time}
                  </div>
                </div>
              ))}

              {jobStatus === "chatting" && chatMessages.length >= 3 && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "0px",
                    border: "1.5px solid var(--accent)",
                    backgroundColor: isDark ? "rgba(66,214,255,0.05)" : "rgba(66,214,255,0.1)",
                    marginTop: "6px",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
                    Ready to Book {activeChatProvider.name}?
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                    Agree to dispatch at {activeChatProvider.rate}. ETA ~15 mins.
                  </div>
                  <button
                    onClick={handleConfirmBooking}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "0px",
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-text)",
                      fontWeight: 800,
                      fontSize: "12px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Confirm & Dispatch Worker Now
                  </button>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: "10px 12px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
              }}
            >
              <button
                type="button"
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
              >
                <Camera size={16} />
              </button>
              <input
                type="text"
                placeholder="Type your message / address..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "6px 12px",
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                  border: "none",
                  borderRadius: "0px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        )}

      </div>
    </section>
  );
}
