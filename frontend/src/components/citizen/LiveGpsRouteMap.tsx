"use client";

import React, { useEffect, useRef, useState } from "react";
import { Navigation, MapPin, Radio, ShieldCheck, CheckCircle2, Zap } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface LiveGpsRouteMapProps {
  workerName: string;
  vehiclePlate?: string;
  locality: string;
  etaMinutes?: number;
  stage?: string;
  onGeofenceArrival?: () => void;
}

export function LiveGpsRouteMap({
  workerName,
  vehiclePlate,
  locality,
  etaMinutes = 14,
  stage = "EN_ROUTE",
  onGeofenceArrival,
}: LiveGpsRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [currentDistanceKm, setCurrentDistanceKm] = useState<number>(3.2);
  const [currentEta, setCurrentEta] = useState<number>(etaMinutes);
  const [isGeofenced, setIsGeofenced] = useState<boolean>(stage === "IN_PROGRESS");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const homeCoords: [number, number] = [6.8485, 79.9265];
  const workerCoords: [number, number] = [6.865, 79.912];
  const routePoints: [number, number][] = [
    workerCoords,
    [6.858, 79.918],
    [6.852, 79.923],
    homeCoords,
  ];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default || (await import("leaflet"));
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [6.856, 79.92],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      });

      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

      L.tileLayer(tileUrl, { subdomains: "abcd", maxZoom: 19 }).addTo(map);

      // Home Geofence Circle (50m radius)
      L.circle(homeCoords, {
        radius: 80,
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: "3, 6",
      }).addTo(map);

      // Home Icon (Clean SVG)
      const homeIcon = L.divIcon({
        className: "gps-home-pin",
        html: `
          <div style="
            width: 32px; height: 32px;
            background: #10b981; color: #ffffff;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Worker Vehicle Icon (Clean SVG)
      const workerIcon = L.divIcon({
        className: "gps-worker-pin",
        html: `
          <div style="
            width: 34px; height: 34px;
            background: #0891b2; color: #ffffff;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            animation: pulse 2s infinite;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker(homeCoords, { icon: homeIcon }).addTo(map);

      const initialPos = stage === "IN_PROGRESS" ? homeCoords : workerCoords;
      const workerMarker = L.marker(initialPos, { icon: workerIcon }).addTo(map);
      workerMarkerRef.current = workerMarker;

      L.polyline(routePoints, {
        color: isDark ? "#42d6ff" : "#0891b2",
        weight: 4,
        dashArray: "6, 8",
        opacity: 0.9,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isDark, stage]);

  // Fast forward simulation along route points
  const handleSimulateFastForward = () => {
    if (isSimulating || stage !== "EN_ROUTE") return;
    setIsSimulating(true);

    let step = 0;
    const totalSteps = routePoints.length;

    const interval = setInterval(() => {
      step += 1;
      if (step < totalSteps) {
        const nextCoord = routePoints[step];
        if (workerMarkerRef.current) {
          workerMarkerRef.current.setLatLng(nextCoord);
        }

        const remainingRatio = (totalSteps - 1 - step) / (totalSteps - 1);
        const dist = Math.max(0.04, Number((3.2 * remainingRatio).toFixed(1)));
        const eta = Math.max(1, Math.round(14 * remainingRatio));
        setCurrentDistanceKm(dist);
        setCurrentEta(eta);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setIsGeofenced(true);
        setCurrentDistanceKm(0.02);
        setCurrentEta(0);
        if (workerMarkerRef.current) {
          workerMarkerRef.current.setLatLng(homeCoords);
        }
        if (onGeofenceArrival) {
          onGeofenceArrival();
        }
      }
    }, 1200);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "240px",
        backgroundColor: isDark ? "#090b0e" : "#f1f5f9",
        border: "1px solid var(--border)",
        overflow: "hidden",
        marginTop: "20px",
      }}
    >
      {/* Top telemetry overlay banner */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          right: "10px",
          zIndex: 400,
          backgroundColor: isDark ? "rgba(9, 11, 14, 0.9)" : "rgba(255, 255, 255, 0.94)",
          border: "1px solid var(--border)",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: isGeofenced ? "#0891b2" : "#10b981",
              boxShadow: `0 0 10px ${isGeofenced ? "#0891b2" : "#10b981"}`,
            }}
          />
          <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)" }}>
            {isGeofenced
              ? "GEOFENCE VERIFIED ON PROPERTY (<50m)"
              : "LIVE GPS ROUTE TELEMETRY · High Level Rd"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12px" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            Distance:{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {isGeofenced ? "< 30 meters" : `${currentDistanceKm} km`}
            </strong>
          </span>
          <span style={{ color: isGeofenced ? "#0891b2" : "#10b981", fontWeight: 800 }}>
            {isGeofenced ? "Arrived on site" : `ETA ~${currentEta} mins`}
          </span>
        </div>
      </div>

      {/* Map DOM target */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Bottom vehicle tag & Fast Forward Geofence simulator */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          right: "10px",
          zIndex: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            backgroundColor: isDark ? "rgba(9, 11, 14, 0.88)" : "rgba(255, 255, 255, 0.92)",
            border: "1px solid var(--border)",
            padding: "5px 12px",
            fontSize: "11.5px",
            fontWeight: 700,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Navigation size={13} color="var(--accent)" />
          <span>{workerName} · {vehiclePlate || "En Route"}</span>
        </div>

        {stage === "EN_ROUTE" && (
          <button
            type="button"
            onClick={handleSimulateFastForward}
            disabled={isSimulating}
            style={{
              padding: "5px 12px",
              backgroundColor: isSimulating ? "#10b981" : "var(--accent)",
              color: "var(--accent-text)",
              border: "none",
              fontWeight: 800,
              fontSize: "11.5px",
              cursor: isSimulating ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <Zap size={12} />
            <span>{isSimulating ? "Simulating GPS Arrival..." : "Simulate Auto-Arrival (<50m)"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
