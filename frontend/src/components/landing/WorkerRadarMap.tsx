"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  MapPin,
  Users,
  Navigation,
  Radio,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Filter,
  Paintbrush,
  Trees,
  Wrench,
  Sparkles,
  Laptop,
  Layers,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface DistrictData {
  id: string;
  name: string;
  province: string;
  activeTotal: number;
  avgResponse: string;
  topTrades: { name: string; count: number; icon: React.ElementType; color: string }[];
  recentJob: { title: string; worker: string; rating: string; locality: string };
  coords: { x: number; y: number }; // SVG percentage
}

const DISTRICT_LIST: DistrictData[] = [
  {
    id: "colombo",
    name: "Colombo District",
    province: "Western Province",
    activeTotal: 184,
    avgResponse: "< 15 mins",
    topTrades: [
      { name: "Painters", count: 52, icon: Paintbrush, color: "#f97316" },
      { name: "Plumbers", count: 44, icon: Wrench, color: "#06b6d4" },
      { name: "PC Techs", count: 38, icon: Laptop, color: "#8b5cf6" },
      { name: "Tree Cutters", count: 26, icon: Trees, color: "#10b981" },
      { name: "Cleaners", count: 24, icon: Sparkles, color: "#3b82f6" },
    ],
    recentJob: {
      title: "2-Storey Wall Color-Wash & Plastering",
      worker: "Kamal Perera (4.9 ★)",
      rating: "5.0",
      locality: "Maharagama Town",
    },
    coords: { x: 200, y: 410 },
  },
  {
    id: "gampaha",
    name: "Gampaha District",
    province: "Western Province",
    activeTotal: 142,
    avgResponse: "< 20 mins",
    topTrades: [
      { name: "Tree Cutters", count: 41, icon: Trees, color: "#10b981" },
      { name: "Painters", count: 36, icon: Paintbrush, color: "#f97316" },
      { name: "Plumbers", count: 29, icon: Wrench, color: "#06b6d4" },
      { name: "Cleaners", count: 21, icon: Sparkles, color: "#3b82f6" },
      { name: "PC Techs", count: 15, icon: Laptop, color: "#8b5cf6" },
    ],
    recentJob: {
      title: "Dangerous Coconut Tree High-Branch Cut",
      worker: "Sunil Kumara (4.8 ★)",
      rating: "4.9",
      locality: "Kadawatha & Kiribathgoda",
    },
    coords: { x: 208, y: 370 },
  },
  {
    id: "kandy",
    name: "Kandy District",
    province: "Central Province",
    activeTotal: 118,
    avgResponse: "< 25 mins",
    topTrades: [
      { name: "Roof Cleaners", count: 34, icon: Sparkles, color: "#3b82f6" },
      { name: "Painters", count: 31, icon: Paintbrush, color: "#f97316" },
      { name: "Tree Climbers", count: 24, icon: Trees, color: "#10b981" },
      { name: "Plumbers", count: 18, icon: Wrench, color: "#06b6d4" },
      { name: "PC Techs", count: 11, icon: Laptop, color: "#8b5cf6" },
    ],
    recentJob: {
      title: "Tile Roof Moss Removal & High-Pressure Wash",
      worker: "Asanka Bandara (4.9 ★)",
      rating: "5.0",
      locality: "Peradeniya & Katugastota",
    },
    coords: { x: 268, y: 360 },
  },
  {
    id: "kalutara",
    name: "Kalutara District",
    province: "Western Province",
    activeTotal: 86,
    avgResponse: "< 20 mins",
    topTrades: [
      { name: "Plumbers", count: 28, icon: Wrench, color: "#06b6d4" },
      { name: "Tree Cutters", count: 22, icon: Trees, color: "#10b981" },
      { name: "Painters", count: 19, icon: Paintbrush, color: "#f97316" },
      { name: "Cleaners", count: 11, icon: Sparkles, color: "#3b82f6" },
      { name: "PC Techs", count: 6, icon: Laptop, color: "#8b5cf6" },
    ],
    recentJob: {
      title: "Main Line Bathroom Water Pump Replacement",
      worker: "Nuwan Wickrama (4.9 ★)",
      rating: "4.8",
      locality: "Panadura & Wadduwa",
    },
    coords: { x: 206, y: 450 },
  },
  {
    id: "galle",
    name: "Galle District",
    province: "Southern Province",
    activeTotal: 94,
    avgResponse: "< 25 mins",
    topTrades: [
      { name: "Painters", count: 29, icon: Paintbrush, color: "#f97316" },
      { name: "Cleaners", count: 25, icon: Sparkles, color: "#3b82f6" },
      { name: "Tree Cutters", count: 18, icon: Trees, color: "#10b981" },
      { name: "Plumbers", count: 14, icon: Wrench, color: "#06b6d4" },
      { name: "PC Techs", count: 8, icon: Laptop, color: "#8b5cf6" },
    ],
    recentJob: {
      title: "Villa Exterior Painting & Waterproofing",
      worker: "Ruwan Sanjeewa (4.9 ★)",
      rating: "5.0",
      locality: "Hikkaduwa & Karapitiya",
    },
    coords: { x: 220, y: 508 },
  },
  {
    id: "kurunegala",
    name: "Kurunegala District",
    province: "North Western Province",
    activeTotal: 78,
    avgResponse: "< 30 mins",
    topTrades: [
      { name: "Tree Climbers", count: 27, icon: Trees, color: "#10b981" },
      { name: "Painters", count: 21, icon: Paintbrush, color: "#f97316" },
      { name: "PC Techs", count: 13, icon: Laptop, color: "#8b5cf6" },
      { name: "Plumbers", count: 11, icon: Wrench, color: "#06b6d4" },
      { name: "Cleaners", count: 6, icon: Sparkles, color: "#3b82f6" },
    ],
    recentJob: {
      title: "Desktop PC Motherboard Repair & Re-Install",
      worker: "Dinesh Weerasinghe (4.9 ★)",
      rating: "5.0",
      locality: "Kuliyapitiya Town",
    },
    coords: { x: 228, y: 310 },
  },
  {
    id: "matara",
    name: "Matara District",
    province: "Southern Province",
    activeTotal: 62,
    avgResponse: "< 25 mins",
    topTrades: [
      { name: "Tree Cutters", count: 19, icon: Trees, color: "#10b981" },
      { name: "Painters", count: 16, icon: Paintbrush, color: "#f97316" },
      { name: "Plumbers", count: 14, icon: Wrench, color: "#06b6d4" },
      { name: "Cleaners", count: 9, icon: Sparkles, color: "#3b82f6" },
      { name: "PC Techs", count: 4, icon: Laptop, color: "#8b5cf6" },
    ],
    recentJob: {
      title: "Storm Drain Clearing & Water Tank Wash",
      worker: "Kithsiri Liyanage (4.8 ★)",
      rating: "4.9",
      locality: "Weligama & Mirissa",
    },
    coords: { x: 250, y: 532 },
  },
  {
    id: "jaffna",
    name: "Jaffna District",
    province: "Northern Province",
    activeTotal: 58,
    avgResponse: "< 30 mins",
    topTrades: [
      { name: "Painters", count: 20, icon: Paintbrush, color: "#f97316" },
      { name: "Tree Cutters", count: 15, icon: Trees, color: "#10b981" },
      { name: "Plumbers", count: 12, icon: Wrench, color: "#06b6d4" },
      { name: "PC Techs", count: 7, icon: Laptop, color: "#8b5cf6" },
      { name: "Cleaners", count: 4, icon: Sparkles, color: "#3b82f6" },
    ],
    recentJob: {
      title: "Residential House Color-Wash & Roof Prep",
      worker: "K. Thavanesan (4.9 ★)",
      rating: "5.0",
      locality: "Nallur & Chavakachcheri",
    },
    coords: { x: 250, y: 42 },
  },
];

const FILTER_TRADES = [
  { id: "all", label: "All Trades" },
  { id: "painting", label: "Painters", color: "#f97316" },
  { id: "trees", label: "Tree Cutters", color: "#10b981" },
  { id: "plumbing", label: "Plumbers", color: "#06b6d4" },
  { id: "cleaning", label: "Roof & Clean", color: "#3b82f6" },
  { id: "tech", label: "PC Techs", color: "#8b5cf6" },
];

export function WorkerRadarMap() {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData>(DISTRICT_LIST[0]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".radar-header-anim",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );
      gsap.fromTo(
        ".radar-pin",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.06, ease: "back.out(2)" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="workers-map"
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

        {/* ── Section Header ────────────────────────────────────── */}
        <div style={{ maxWidth: "780px", marginBottom: "40px" }}>
          <div
            className="radar-header-anim"
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
            <Radio size={14} />
            <span>Sri Lanka Local Worker Radar</span>
          </div>

          <h2
            className="radar-header-anim"
            style={{
              fontSize: "clamp(2rem, 3.8vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Explore Active Workers by District.
          </h2>

          <p
            className="radar-header-anim"
            style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
            }}
          >
            Select a region on the live radar map to inspect available local painters, tree cutters,
            plumbers, cleaners, and computer technicians ready for immediate hire.
          </p>
        </div>

        {/* ── Category Filter Bar ───────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          {FILTER_TRADES.map((filter) => {
            const isSelected = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "0px",
                  backgroundColor: isSelected
                    ? isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(15,23,42,0.9)"
                    : "transparent",
                  color: isSelected
                    ? isDark
                      ? "#ffffff"
                      : "#ffffff"
                    : "var(--text-primary)",
                  border: isSelected
                    ? `1.5px solid ${filter.color || "var(--accent)"}`
                    : "1px solid var(--border)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
              >
                {filter.color && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "0px",
                      backgroundColor: filter.color,
                    }}
                  />
                )}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Radar Map Grid (Map on Left, Live Telemetry on Right) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "24px",
            minHeight: "560px",
          }}
        >
          {/* Left Column: Interactive Sri Lanka Radar Map SVG */}
          <div
            style={{
              position: "relative",
              padding: "24px",
              borderRadius: "0px",
              backgroundColor: isDark ? "rgba(12, 16, 26, 0.85)" : "rgba(240, 244, 250, 0.85)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backdropFilter: "blur(16px)",
              overflow: "hidden",
            }}
          >
            {/* Radar Grid overlay background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: isDark
                  ? "radial-gradient(rgba(66, 214, 255, 0.08) 1px, transparent 0)"
                  : "radial-gradient(rgba(15, 23, 42, 0.06) 1px, transparent 0)",
                backgroundSize: "24px 24px",
                pointerEvents: "none",
              }}
            />

            {/* Radar Status Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "12px",
                borderBottom: "1px solid var(--border)",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "0px",
                    backgroundColor: "#10b981",
                    boxShadow: "0 0 8px #10b981",
                  }}
                />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                  LIVE RADAR ACTIVE · SRI LANKA 8 ZONES
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                Click a Pin to Inspect
              </span>
            </div>

            {/* Map Visual Container */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "460px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <svg
                viewBox="0 0 500 580"
                style={{ width: "100%", height: "100%", maxHeight: "450px" }}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* ── Realistic Sri Lanka Geographic Landmass ── */}
                {/* Mainland Coastline */}
                <path
                  d="M 242 42
                     C 255 35, 275 38, 282 52
                     C 288 65, 278 78, 268 85
                     C 275 95, 290 102, 305 110
                     C 325 122, 338 145, 342 170
                     C 345 185, 338 195, 345 205
                     C 352 215, 362 230, 368 255
                     C 375 285, 382 315, 382 345
                     C 382 375, 375 405, 365 435
                     C 355 465, 335 490, 310 508
                     C 285 525, 260 532, 245 532
                     C 230 532, 218 522, 212 505
                     C 205 488, 202 468, 200 448
                     C 198 428, 192 408, 194 388
                     C 196 368, 192 348, 190 328
                     C 188 308, 172 290, 172 270
                     C 172 250, 182 235, 192 215
                     C 202 195, 208 175, 208 155
                     C 208 135, 198 120, 208 102
                     C 218 85, 230 55, 242 42
                     Z"
                  fill={isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.05)"}
                  stroke={isDark ? "rgba(66,214,255,0.4)" : "rgba(15,23,42,0.3)"}
                  strokeWidth="1.75"
                />

                {/* Jaffna Peninsula & Northern Islands */}
                <path
                  d="M 230 35 C 240 28, 258 28, 268 35 C 275 42, 270 52, 260 52 C 248 52, 238 45, 230 35 Z"
                  fill={isDark ? "rgba(66,214,255,0.12)" : "rgba(15,23,42,0.08)"}
                  stroke={isDark ? "rgba(66,214,255,0.6)" : "rgba(15,23,42,0.4)"}
                  strokeWidth="1.5"
                />
                <circle cx="218" cy="40" r="4" fill={isDark ? "rgba(66,214,255,0.3)" : "rgba(15,23,42,0.2)"} />
                <circle cx="208" cy="48" r="3" fill={isDark ? "rgba(66,214,255,0.3)" : "rgba(15,23,42,0.2)"} />

                {/* Mannar Island (North-West) */}
                <path
                  d="M 182 125 C 190 120, 202 124, 205 130 C 200 134, 188 132, 182 125 Z"
                  fill={isDark ? "rgba(66,214,255,0.15)" : "rgba(15,23,42,0.1)"}
                  stroke={isDark ? "rgba(66,214,255,0.5)" : "rgba(15,23,42,0.3)"}
                  strokeWidth="1.2"
                />

                {/* Kalpitiya Peninsula (West) */}
                <path
                  d="M 175 250 C 172 265, 175 285, 178 295 C 182 295, 180 275, 178 250 Z"
                  fill={isDark ? "rgba(66,214,255,0.15)" : "rgba(15,23,42,0.1)"}
                  stroke={isDark ? "rgba(66,214,255,0.4)" : "rgba(15,23,42,0.3)"}
                  strokeWidth="1.2"
                />

                {/* Internal Province Boundaries (Subtle Dash) */}
                {/* Northern / North Central line */}
                <path d="M 208 155 Q 260 145 342 170" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} strokeWidth="1" strokeDasharray="3 3"/>
                {/* North Central / Central line */}
                <path d="M 192 270 Q 270 275 368 255" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} strokeWidth="1" strokeDasharray="3 3"/>
                {/* Central / Western line */}
                <path d="M 194 360 Q 255 350 310 370" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} strokeWidth="1" strokeDasharray="3 3"/>
                {/* Western / Southern line */}
                <path d="M 200 455 Q 260 450 355 465" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} strokeWidth="1" strokeDasharray="3 3"/>

                {/* Tactical Radar Ring around Selected District */}
                <circle
                  cx={selectedDistrict.coords.x}
                  cy={selectedDistrict.coords.y}
                  r="24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                  opacity="0.8"
                />
                <circle
                  cx={selectedDistrict.coords.x}
                  cy={selectedDistrict.coords.y}
                  r="40"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="0.75"
                  strokeDasharray="2 4"
                  opacity="0.4"
                />

                {/* District Hotspot Pins */}
                {DISTRICT_LIST.map((dist) => {
                  const isSelected = selectedDistrict.id === dist.id;

                  return (
                    <g
                      key={dist.id}
                      className="radar-pin"
                      onClick={() => setSelectedDistrict(dist)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Pulse Box for active hotspot */}
                      {isSelected && (
                        <rect
                          x={dist.coords.x - 12}
                          y={dist.coords.y - 12}
                          width="24"
                          height="24"
                          fill="rgba(66, 214, 255, 0.15)"
                          stroke="var(--accent)"
                          strokeWidth="1"
                        />
                      )}

                      {/* Pin Outer Box (Sharp 0px Square) */}
                      <rect
                        x={dist.coords.x - 6}
                        y={dist.coords.y - 6}
                        width="12"
                        height="12"
                        fill={isSelected ? "var(--accent)" : isDark ? "#0f172a" : "#ffffff"}
                        stroke={isSelected ? "#ffffff" : isDark ? "rgba(255,255,255,0.5)" : "#0f172a"}
                        strokeWidth="1.5"
                        style={{ transition: "all 0.2s ease" }}
                      />

                      {/* Pin Center Dot */}
                      <rect
                        x={dist.coords.x - 2}
                        y={dist.coords.y - 2}
                        width="4"
                        height="4"
                        fill={isSelected ? "#000000" : "var(--accent)"}
                      />

                      {/* District Label */}
                      <text
                        x={dist.coords.x + 10}
                        y={dist.coords.y + 4}
                        fill={isSelected ? "var(--text-primary)" : "var(--text-secondary)"}
                        fontSize="11"
                        fontWeight={isSelected ? "800" : "600"}
                        fontFamily="inherit"
                        style={{
                          textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.8)" : "0 1px 3px rgba(255,255,255,0.9)",
                        }}
                      >
                        {dist.name.replace(" District", "")} ({dist.activeTotal})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom Legend */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "12px",
                borderTop: "1px solid var(--border)",
                position: "relative",
                zIndex: 2,
                fontSize: "11px",
                color: "var(--text-secondary)",
              }}
            >
              <span>Selected Region: <strong style={{ color: "var(--text-primary)" }}>{selectedDistrict.name}</strong></span>
              <span>Total Active Workers in Network: <strong>824</strong></span>
            </div>
          </div>

          {/* Right Column: Real-Time District Telemetry & Action Panel */}
          <div
            style={{
              padding: "36px",
              borderRadius: "0px",
              backgroundColor: isDark ? "rgba(18, 24, 38, 0.85)" : "rgba(255, 255, 255, 0.95)",
              border: "1.5px solid var(--accent)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backdropFilter: "blur(16px)",
            }}
          >
            <div>
              {/* Region Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--accent)",
                      marginBottom: "4px",
                    }}
                  >
                    {selectedDistrict.province}
                  </div>
                  <h3
                    style={{
                      fontSize: "26px",
                      fontWeight: 900,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.02em",
                      margin: 0,
                    }}
                  >
                    {selectedDistrict.name}
                  </h3>
                </div>

                <div
                  style={{
                    padding: "8px 14px",
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid #10b981",
                    color: "#10b981",
                    fontSize: "13px",
                    fontWeight: 800,
                  }}
                >
                  {selectedDistrict.activeTotal} Verified Workers Active
                </div>
              </div>

              {/* District Trade Breakdown */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Layers size={13} />
                  <span>Available Trades in {selectedDistrict.name.replace(" District", "")}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                  {selectedDistrict.topTrades.map((trade) => {
                    const Icon = trade.icon;
                    return (
                      <div
                        key={trade.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: "0px",
                          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Icon size={16} color={trade.color} />
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                            {trade.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 800,
                            color: trade.color,
                            backgroundColor: `${trade.color}15`,
                            padding: "2px 8px",
                          }}
                        >
                          {trade.count} Available
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Highlighted Recent Verified Job */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "0px",
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  border: "1px solid var(--border)",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase" }}>
                    Recent Completed Job in {selectedDistrict.recentJob.locality}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700, color: "#eab308" }}>
                    <Star size={13} fill="#eab308" />
                    <span>{selectedDistrict.recentJob.rating} ★ Verified</span>
                  </div>
                </div>

                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                  {selectedDistrict.recentJob.title}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Completed by: <strong style={{ color: "var(--text-primary)" }}>{selectedDistrict.recentJob.worker}</strong>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                paddingTop: "20px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <Link
                href={`#services?district=${selectedDistrict.id}`}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 20px",
                  borderRadius: "0px",
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                  fontSize: "13px",
                  fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px var(--accent-glow)",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <span>Browse {selectedDistrict.name.replace(" District", "")} Workers</span>
                <ArrowRight size={14} />
              </Link>

              <Link
                href={`/request?district=${selectedDistrict.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "13px 20px",
                  borderRadius: "0px",
                  backgroundColor: "var(--card-bg)",
                  border: "1.5px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <MessageSquare size={14} />
                <span>Post Job in this Area</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
