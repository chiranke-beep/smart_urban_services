"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  Radio,
  Layers,
  Star,
  ArrowRight,
  MessageSquare,
  Paintbrush,
  Trees,
  Wrench,
  Home,
  Laptop,
  Compass,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { apiClient } from "@/services/api";
import type * as LeafletType from "leaflet";

interface DistrictLocation {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  activeTotal: number;
  avgResponse: string;
  topTrades: { name: string; count: number; icon: React.ElementType; color: string }[];
  recentJob: { title: string; worker: string; rating: string; locality: string };
}

const DISTRICT_LOCATIONS: DistrictLocation[] = [
  {
    id: "colombo",
    name: "Colombo District",
    province: "Western Province",
    lat: 6.885,
    lng: 79.905,
    activeTotal: 184,
    avgResponse: "< 15 mins",
    topTrades: [
      { name: "Painters", count: 52, icon: Paintbrush, color: "#f97316" },
      { name: "Plumbers", count: 44, icon: Wrench, color: "#06b6d4" },
      { name: "PC Techs", count: 38, icon: Laptop, color: "#8b5cf6" },
      { name: "Tree Cutters", count: 26, icon: Trees, color: "#10b981" },
      { name: "Cleaners", count: 24, icon: Home, color: "#3b82f6" },
    ],
    recentJob: {
      title: "2-Storey Wall Color-Wash & Plastering",
      worker: "Kamal Perera (4.9 ★)",
      rating: "5.0",
      locality: "Maharagama Town",
    },
  },
  {
    id: "gampaha",
    name: "Gampaha District",
    province: "Western Province",
    lat: 7.084,
    lng: 79.994,
    activeTotal: 142,
    avgResponse: "< 20 mins",
    topTrades: [
      { name: "Tree Cutters", count: 41, icon: Trees, color: "#10b981" },
      { name: "Painters", count: 36, icon: Paintbrush, color: "#f97316" },
      { name: "Plumbers", count: 29, icon: Wrench, color: "#06b6d4" },
      { name: "Cleaners", count: 21, icon: Home, color: "#3b82f6" },
      { name: "PC Techs", count: 15, icon: Laptop, color: "#8b5cf6" },
    ],
    recentJob: {
      title: "Dangerous Coconut Tree High-Branch Cut",
      worker: "Sunil Kumara (4.8 ★)",
      rating: "4.9",
      locality: "Kadawatha & Kiribathgoda",
    },
  },
  {
    id: "kandy",
    name: "Kandy District",
    province: "Central Province",
    lat: 7.2906,
    lng: 80.6337,
    activeTotal: 118,
    avgResponse: "< 25 mins",
    topTrades: [
      { name: "Roof Cleaners", count: 34, icon: Home, color: "#3b82f6" },
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
  },
  {
    id: "kalutara",
    name: "Kalutara District",
    province: "Western Province",
    lat: 6.5854,
    lng: 79.9607,
    activeTotal: 86,
    avgResponse: "< 20 mins",
    topTrades: [
      { name: "Plumbers", count: 28, icon: Wrench, color: "#06b6d4" },
      { name: "Tree Cutters", count: 22, icon: Trees, color: "#10b981" },
      { name: "Painters", count: 19, icon: Paintbrush, color: "#f97316" },
      { name: "Cleaners", count: 11, icon: Home, color: "#3b82f6" },
      { name: "PC Techs", count: 6, icon: Laptop, color: "#8b5cf6" },
    ],
    recentJob: {
      title: "Main Line Bathroom Water Pump Replacement",
      worker: "Nuwan Wickrama (4.9 ★)",
      rating: "4.8",
      locality: "Panadura & Wadduwa",
    },
  },
  {
    id: "galle",
    name: "Galle District",
    province: "Southern Province",
    lat: 6.0535,
    lng: 80.221,
    activeTotal: 94,
    avgResponse: "< 25 mins",
    topTrades: [
      { name: "Painters", count: 29, icon: Paintbrush, color: "#f97316" },
      { name: "Cleaners", count: 25, icon: Home, color: "#3b82f6" },
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
  },
  {
    id: "kurunegala",
    name: "Kurunegala District",
    province: "North Western Province",
    lat: 7.4863,
    lng: 80.3623,
    activeTotal: 78,
    avgResponse: "< 30 mins",
    topTrades: [
      { name: "Tree Climbers", count: 27, icon: Trees, color: "#10b981" },
      { name: "Painters", count: 21, icon: Paintbrush, color: "#f97316" },
      { name: "PC Techs", count: 13, icon: Laptop, color: "#8b5cf6" },
      { name: "Plumbers", count: 11, icon: Wrench, color: "#06b6d4" },
      { name: "Cleaners", count: 6, icon: Home, color: "#3b82f6" },
    ],
    recentJob: {
      title: "Desktop PC Motherboard Repair & Re-Install",
      worker: "Dinesh Weerasinghe (4.9 ★)",
      rating: "5.0",
      locality: "Kuliyapitiya Town",
    },
  },
  {
    id: "matara",
    name: "Matara District",
    province: "Southern Province",
    lat: 5.9549,
    lng: 80.555,
    activeTotal: 62,
    avgResponse: "< 25 mins",
    topTrades: [
      { name: "Tree Cutters", count: 19, icon: Trees, color: "#10b981" },
      { name: "Painters", count: 16, icon: Paintbrush, color: "#f97316" },
      { name: "Plumbers", count: 14, icon: Wrench, color: "#06b6d4" },
      { name: "Cleaners", count: 9, icon: Home, color: "#3b82f6" },
      { name: "PC Techs", count: 4, icon: Laptop, color: "#8b5cf6" },
    ],
    recentJob: {
      title: "Storm Drain Clearing & Water Tank Wash",
      worker: "Kithsiri Liyanage (4.8 ★)",
      rating: "4.9",
      locality: "Weligama & Mirissa",
    },
  },
  {
    id: "jaffna",
    name: "Jaffna District",
    province: "Northern Province",
    lat: 9.6615,
    lng: 80.0255,
    activeTotal: 58,
    avgResponse: "< 30 mins",
    topTrades: [
      { name: "Painters", count: 20, icon: Paintbrush, color: "#f97316" },
      { name: "Tree Cutters", count: 15, icon: Trees, color: "#10b981" },
      { name: "Plumbers", count: 12, icon: Wrench, color: "#06b6d4" },
      { name: "PC Techs", count: 7, icon: Laptop, color: "#8b5cf6" },
      { name: "Cleaners", count: 4, icon: Home, color: "#3b82f6" },
    ],
    recentJob: {
      title: "Residential House Color-Wash & Roof Prep",
      worker: "K. Thavanesan (4.9 ★)",
      rating: "5.0",
      locality: "Nallur & Chavakachcheri",
    },
  },
];

const FILTER_TRADES = [
  { id: "all", label: "All Trades" },
  { id: "painting", label: "Painters", color: "#f97316" },
  { id: "trees", label: "Tree Cutters", color: "#10b981" },
  { id: "plumbing", label: "Plumbers", color: "#06b6d4" },
  { id: "cleaning", label: "Roof & Clean", color: "#3b82f6" },
  { id: "tech", label: "PC Techs", color: "#8b5cf6" },
  { id: "custom", label: "Odd & Custom Jobs", color: "#eab308" },
];

export function RealLeafletMap() {
  const [districts, setDistricts] = useState<DistrictLocation[]>(DISTRICT_LOCATIONS);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictLocation>(DISTRICT_LOCATIONS[0]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const markersRef = useRef<LeafletType.Marker[]>([]);
  const tileLayerRef = useRef<LeafletType.TileLayer | null>(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    Promise.all([
      apiClient<{ success: boolean; data?: any[] }>("/providers").catch(() => null),
      apiClient<{ success: boolean; data?: any[] }>("/reviews").catch(() => null),
    ]).then(([providersRes, reviewsRes]) => {
      if (providersRes?.data && providersRes.data.length > 0) {
        const liveWorkers = providersRes.data;
        setDistricts((prev) =>
          prev.map((d) => {
            const districtShort = d.name.toLowerCase().replace(" district", "").trim();
            const matched = liveWorkers.filter(
              (w) => (w.district || "").toLowerCase().includes(districtShort)
            );
            if (matched.length > 0) {
              return {
                ...d,
                activeTotal: matched.length,
                recentJob: {
                  title: matched[0].trade || "Verified Specialist",
                  worker: `${matched[0].fullName || "Specialist"} (${Number(matched[0].rating || 5).toFixed(1)} Rating)`,
                  rating: Number(matched[0].rating || 5).toFixed(1),
                  locality: `${matched[0].locality || "Town"}, ${d.name}`,
                },
              };
            }
            return d;
          })
        );
      }
    });
  }, []);

  // Initialize Real Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = await import("leaflet");

      if (!isMounted) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map focused on Sri Lanka
      const map = L.map(mapContainerRef.current, {
        center: [7.8731, 80.7718],
        zoom: 7.5,
        minZoom: 6.8,
        maxZoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      // Add Zoom control at top right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Standard OpenStreetMap tile server (100% Free, no API keys)
      const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tiles = L.tileLayer(tileUrl, {
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;
      setIsMapLoaded(true);

      // Render custom sharp square markers
      renderMarkers(L, map);
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when theme toggles
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      if (!mapInstanceRef.current) return;
      renderMarkers(L, mapInstanceRef.current);
    });
  }, [isDark, selectedDistrict]);

  // Render Custom Sharp Square HTML Markers
  const renderMarkers = (L: typeof import("leaflet"), map: LeafletType.Map) => {
    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    DISTRICT_LOCATIONS.forEach((loc) => {
      const isSelected = selectedDistrict.id === loc.id;

      // Custom Sharp Square HTML Marker Icon
      const customIcon = L.divIcon({
        className: "custom-leaflet-pin",
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
          ">
            <div style="
              width: ${isSelected ? "18px" : "14px"};
              height: ${isSelected ? "18px" : "14px"};
              background-color: ${isSelected ? "var(--accent)" : isDark ? "#0f172a" : "#ffffff"};
              border: ${isSelected ? "2px solid #ffffff" : "2px solid var(--accent)"};
              border-radius: 0px;
              box-shadow: ${isSelected ? "0 0 16px var(--accent)" : "0 2px 8px rgba(0,0,0,0.4)"};
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
            ">
              <div style="
                width: 4px;
                height: 4px;
                background-color: ${isSelected ? "#000000" : "var(--accent)"};
                border-radius: 0px;
              "></div>
            </div>
            <div style="
              background-color: ${isDark ? "rgba(10,14,24,0.9)" : "rgba(255,255,255,0.95)"};
              color: ${isSelected ? "var(--accent)" : "var(--text-primary)"};
              border: 1px solid ${isSelected ? "var(--accent)" : "var(--border)"};
              border-radius: 0px;
              padding: 2px 8px;
              font-size: 11px;
              font-weight: 800;
              white-space: nowrap;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
              letter-spacing: -0.01em;
            ">
              ${loc.name.replace(" District", "")} (${loc.activeTotal})
            </div>
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [9, 12],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

      // On Marker Click
      marker.on("click", () => {
        setSelectedDistrict(loc);
        map.flyTo([loc.lat, loc.lng], 10.5, { duration: 1.2 });
      });

      markersRef.current.push(marker);
    });
  };

  const handleSelectDistrict = (loc: DistrictLocation) => {
    setSelectedDistrict(loc);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 10.5, { duration: 1.2 });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([7.8731, 80.7718], 7.5, { duration: 1 });
    }
  };

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
        <div style={{ maxWidth: "820px", marginBottom: "36px" }}>
          <div
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
            <span>Real OpenStreetMap & Leaflet Geospatial Radar</span>
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
            Real Sri Lanka Interactive Worker Radar.
          </h2>

          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
            }}
          >
            Explore real interactive Sri Lanka road maps powered by OpenStreetMap & CartoDB. Pan, zoom,
            and inspect live verified workers, plumbers, painters, tree cutters, and PC technicians in any town.
          </p>
        </div>

        {/* ── Category Filter Bar ───────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
                    color: isSelected ? "#ffffff" : "var(--text-primary)",
                    border: isSelected
                      ? `1.5px solid ${filter.color || "var(--accent)"}`
                      : "1px solid var(--border)",
                    fontSize: "12px",
                    fontWeight: 700,
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

          <button
            onClick={handleResetView}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "0px",
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Compass size={14} color="var(--accent)" />
            <span>Reset Island View</span>
          </button>
        </div>

        {/* ── Main Radar Layout: Real Leaflet Map + Live Telemetry ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 1fr",
            gap: "24px",
            minHeight: "560px",
          }}
        >
          {/* Left Column: Real Interactive Leaflet Container */}
          <div
            style={{
              position: "relative",
              borderRadius: "0px",
              border: "1px solid var(--border)",
              backgroundColor: isDark ? "#090b0e" : "#f0f4f8",
              height: "560px",
              overflow: "hidden",
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.3)",
            }}
          >
            {/* Real Leaflet Map DIV */}
            <div
              ref={mapContainerRef}
              style={{
                width: "100%",
                height: "100%",
                zIndex: 1,
              }}
            />

            {/* Tactical Live Radar Overlay Status */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                zIndex: 400,
                padding: "8px 14px",
                borderRadius: "0px",
                backgroundColor: isDark ? "rgba(10,14,24,0.92)" : "rgba(255,255,255,0.95)",
                border: "1px solid var(--border)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--text-primary)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "0px",
                  backgroundColor: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                }}
              />
              <span>OPENSTREETMAP LIVE TILES · SRI LANKA</span>
            </div>

            {/* Quick District Navigation Bar along the bottom of the map */}
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "16px",
                right: "16px",
                zIndex: 400,
                padding: "8px 12px",
                borderRadius: "0px",
                backgroundColor: isDark ? "rgba(10,14,24,0.92)" : "rgba(255,255,255,0.95)",
                border: "1px solid var(--border)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                overflowX: "auto",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginRight: "6px", whiteSpace: "nowrap" }}>
                Quick Focus:
              </span>
              {DISTRICT_LOCATIONS.map((loc) => {
                const isSelected = selectedDistrict.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectDistrict(loc)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "0px",
                      backgroundColor: isSelected ? "var(--accent)" : "transparent",
                      color: isSelected ? "#000000" : "var(--text-primary)",
                      border: "1px solid var(--border)",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontFamily: "inherit",
                    }}
                  >
                    {loc.name.replace(" District", "")}
                  </button>
                );
              })}
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
                    borderRadius: "0px",
                  }}
                >
                  {selectedDistrict.activeTotal} Verified Workers Active
                </div>
              </div>

              {/* District Trade Breakdown */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Layers size={14} />
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
                          <Icon size={17} color={trade.color} />
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                            {trade.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: trade.color,
                            backgroundColor: `${trade.color}15`,
                            padding: "3px 9px",
                            borderRadius: "0px",
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
                  padding: "18px",
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
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase" }}>
                    Recent Completed Job in {selectedDistrict.recentJob.locality}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#eab308" }}>
                    <Star size={14} fill="#eab308" />
                    <span>{selectedDistrict.recentJob.rating} ★ Verified</span>
                  </div>
                </div>

                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
                  {selectedDistrict.recentJob.title}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
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
                href={`/dashboard?district=${selectedDistrict.id}`}
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
                  fontSize: "14px",
                  fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px var(--accent-glow)",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <span>Browse {selectedDistrict.name.replace(" District", "")} Workers</span>
                <ArrowRight size={15} />
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
                  fontSize: "14px",
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
