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

const PROVIDERS_DATA: Provider[] = [
  {
    id: "p1",
    name: "Kamal Perera",
    avatarBg: "#f97316",
    trade: "Master Painter & Color Specialist",
    tradeType: "painting",
    rating: "4.9",
    reviewCount: 184,
    distance: "1.2 km away",
    eta: "~15 min arrival",
    rate: "Rs. 3,200 / day",
    locality: "Maharagama, Colombo",
    verified: true,
    status: "available",
    skills: ["Exterior Weathercoat", "Wood Varnish", "Waterproofing", "Plaster Smoothing"],
    recentJob: "2-Storey House Painting (5.0 ★)",
  },
  {
    id: "p2",
    name: "Sunil Kumara",
    avatarBg: "#10b981",
    trade: "Tree Climber & Yard Specialist",
    tradeType: "trees",
    rating: "4.8",
    reviewCount: 142,
    distance: "2.1 km away",
    eta: "~20 min arrival",
    rate: "Rs. 3,500 / job",
    locality: "Pannipitiya & Kottawa",
    verified: true,
    status: "available",
    skills: ["High Branch Trimming", "Chain-Saw Cut", "Coconut Plucking", "Powerline Clearance"],
    recentJob: "Dangerous Storm Branch Cut (4.9 ★)",
  },
  {
    id: "p3",
    name: "Nuwan Wickramasinghe",
    avatarBg: "#06b6d4",
    trade: "Emergency Plumber & Pipe Tech",
    tradeType: "plumbing",
    rating: "4.9",
    reviewCount: 210,
    distance: "0.8 km away",
    eta: "~10 min arrival",
    rate: "Rs. 1,800 / callout",
    locality: "Nugegoda & Dehiwala",
    verified: true,
    status: "available",
    skills: ["Burst Pipe Fix", "Water Pump Repair", "Bathroom Fittings", "Drain Unclogging"],
    recentJob: "Underground Pipe Leak Repair (5.0 ★)",
  },
  {
    id: "p4",
    name: "Dinesh Weerasinghe",
    avatarBg: "#8b5cf6",
    trade: "PC, Laptop & Network Technician",
    tradeType: "tech",
    rating: "4.9",
    reviewCount: 165,
    distance: "1.6 km away",
    eta: "~15 min arrival",
    rate: "Rs. 2,000 / fix",
    locality: "Boralesgamuwa, Colombo",
    verified: true,
    status: "available",
    skills: ["Hardware Motherboard", "Blue Screen Fix", "Windows 11 / Mac", "SSD Upgrade"],
    recentJob: "Gaming PC Power Supply Diagnostic (5.0 ★)",
  },
  {
    id: "p5",
    name: "Asanka Bandara",
    avatarBg: "#3b82f6",
    trade: "Roof Moss & Gutter Cleaner",
    tradeType: "cleaning",
    rating: "4.8",
    reviewCount: 98,
    distance: "3.4 km away",
    eta: "~25 min arrival",
    rate: "Rs. 3,500 / roof",
    locality: "Homagama & Kottawa",
    verified: true,
    status: "available",
    skills: ["Pressure Washer", "Tile Roof Moss Clear", "Gutter Debris Wash", "Water Tank Clean"],
    recentJob: "Full Clay Roof Pressure Wash (4.9 ★)",
  },
  {
    id: "p6",
    name: "Kithsiri Liyanage",
    avatarBg: "#10b981",
    trade: "Community Volunteer & Yard Worker",
    tradeType: "trees",
    rating: "4.9",
    reviewCount: 76,
    distance: "2.8 km away",
    eta: "~25 min arrival",
    rate: "Volunteer / Flexible",
    locality: "Maharagama East",
    verified: true,
    status: "available",
    isVolunteer: true,
    skills: ["Elderly Yard Help", "Canal Trash Clear", "Drain Unblocking", "Tree Trimming"],
    recentJob: "Flood Gutter Community Clearing (5.0 ★)",
  },
];

export function NearbyProvidersDeck() {
  const [providers, setProviders] = useState<Provider[]>(PROVIDERS_DATA);
  const [selectedTrade, setSelectedTrade] = useState<string>("all");
  const [activeChatProvider, setActiveChatProvider] = useState<Provider | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "provider"; text: string; time: string }[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [jobStatus, setJobStatus] = useState<"connecting" | "chatting" | "booked">("chatting");
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    // Fetch live service providers from PostgreSQL database
    apiClient<{ success: boolean; data?: any[] }>("/providers")
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          const mapped: Provider[] = res.data.map((p, idx) => ({
            id: `p-${p.id}`,
            name: p.fullName || "Verified Technician",
            avatarBg: ["#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"][idx % 5],
            trade: p.trade || "Master Craftsman",
            tradeType: (p.trade?.toLowerCase().includes("paint") ? "painting"
              : p.trade?.toLowerCase().includes("tree") ? "trees"
              : p.trade?.toLowerCase().includes("plumb") ? "plumbing"
              : p.trade?.toLowerCase().includes("tech") ? "tech"
              : "cleaning") as any,
            rating: Number(p.rating || 4.9).toFixed(1),
            reviewCount: Number(p.reviewCount || 1),
            distance: "1.2 km away",
            eta: "~15 min arrival",
            rate: `Rs. ${p.dailyRate || 3500} / day`,
            locality: `${p.locality}, ${p.district}`,
            verified: Boolean(p.verifiedBadge),
            status: "available",
            skills: ["Verified Work Standards", "Direct Cash/Bank Settlement", "Safety Equipped"],
            recentJob: "Local Verified Service Completed (5.0 Rating)",
          }));
          setProviders(mapped);
        }
      })
      .catch((err) => console.warn("[DB Providers load notice]:", err.message));

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
