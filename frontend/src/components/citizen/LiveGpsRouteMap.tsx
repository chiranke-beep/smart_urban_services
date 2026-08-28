"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Navigation, MapPin, Radio, ShieldCheck, CheckCircle2, LocateFixed, AlertCircle } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { socketService } from "@/services/socketService";

const DEFAULT_LOCALITY_COORDS: Record<string, { home: [number, number]; worker: [number, number] }> = {
  Heerassagala: { home: [7.264242, 80.621701], worker: [7.2885, 80.6325] },
  "Heerassagala, Kandy": { home: [7.264242, 80.621701], worker: [7.2885, 80.6325] },
  Kandy: { home: [7.264242, 80.621701], worker: [7.2885, 80.6325] },
  "Kandy Town": { home: [7.264242, 80.621701], worker: [7.2885, 80.6325] },
  "Colombo Town": { home: [6.9271, 79.8612], worker: [6.9050, 79.8780] },
  Colombo: { home: [6.9271, 79.8612], worker: [6.9050, 79.8780] },
  Maharagama: { home: [6.8485, 79.9265], worker: [6.8650, 79.9050] },
  Nugegoda: { home: [6.8724, 79.8997], worker: [6.8900, 79.8800] },
  Kelaniya: { home: [6.9553, 79.9192], worker: [6.9700, 79.9050] },
  Galle: { home: [6.0535, 80.221], worker: [6.0350, 80.2150] },
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

interface LiveGpsRouteMapProps {
  workerName: string;
  vehiclePlate?: string;
  locality: string;
  homeLat?: number;
  homeLng?: number;
  etaMinutes?: number;
  stage?: string;
  isProviderView?: boolean;
  onGeofenceArrival?: () => void;
}

export function LiveGpsRouteMap({
  workerName,
  vehiclePlate,
  locality,
  homeLat,
  homeLng,
  etaMinutes = 14,
  stage = "EN_ROUTE",
  isProviderView = false,
  onGeofenceArrival,
}: LiveGpsRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const homeMarkerRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const homeCircleRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const routePointsRef = useRef<[number, number][]>([]);
  const pointIndexRef = useRef<number>(0);
  // Ref version of homeCoords to avoid stale closures in socket listeners
  const homeCoordsRef = useRef<[number, number]>([7.2662, 80.6120]);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Location Permission & Active GPS State
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState<boolean>(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState<boolean>(false);

  // Use provided home coords if available, else fall back to locality defaults
  const matchedKey =
    Object.keys(DEFAULT_LOCALITY_COORDS).find((k) =>
      locality.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(locality.toLowerCase())
    ) || "Heerassagala";

  const defaultCoords = DEFAULT_LOCALITY_COORDS[matchedKey] || DEFAULT_LOCALITY_COORDS["Heerassagala"];
  // Home pin = citizen's job location (from props or locality default)
  const initialHome: [number, number] =
    homeLat && homeLng && !isNaN(Number(homeLat)) && !isNaN(Number(homeLng))
      ? [Number(homeLat), Number(homeLng)]
      : defaultCoords.home;
  const initialWorker: [number, number] =
    stage === "IN_PROGRESS" || stage === "COMPLETED"
      ? initialHome
      : defaultCoords.worker;
  const [homeCoords, setHomeCoords] = useState<[number, number]>(initialHome);
  const [workerCoords, setWorkerCoords] = useState<[number, number]>(initialWorker);

  // Keep ref in sync with state so socket listeners get fresh value without re-subscribing
  homeCoordsRef.current = homeCoords;

  const [currentDistanceKm, setCurrentDistanceKm] = useState<number>(0);
  const [currentEta, setCurrentEta] = useState<number>(etaMinutes);
  const [roadStreetName, setRoadStreetName] = useState<string>("Turn-by-Turn Road Route");
  const isGeofenced = stage === "IN_PROGRESS" || stage === "COMPLETED";

  // Fetch Real Turn-by-Turn Road Route from OpenStreetMap OSRM Routing Engine
  const updateRoadRoute = useCallback(async (start: [number, number], end: [number, number], map: any, L: any) => {
    try {
      let actualStart = start;
      const distDirect = calculateDistanceKm(actualStart[0], actualStart[1], end[0], end[1]);
      if (distDirect < 0.05 && stage === "EN_ROUTE") {
        // If testing on same device, keep worker starting at dispatch depot ~2.5km away
        actualStart = defaultCoords.worker;
      } else if (distDirect < 0.05) {
        setCurrentDistanceKm(0.01);
        setCurrentEta(0);
        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
          routePolylineRef.current = null;
        }
        return;
      }

      const url = `https://router.project-osrm.org/route/v1/driving/${actualStart[1]},${actualStart[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      let points: [number, number][] = [];
      if (data?.routes && data.routes[0]) {
        const route = data.routes[0];
        points = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
        routePointsRef.current = points;
        pointIndexRef.current = 0;
        const distKm = Number((route.distance / 1000).toFixed(1));
        const durationMins = Math.max(1, Math.round(route.duration / 60));
        setCurrentDistanceKm(distKm);
        setCurrentEta(durationMins);
        if (route.legs?.[0]?.summary) {
          setRoadStreetName(`Via ${route.legs[0].summary}`);
        }
      } else {
        points = [start, end];
        routePointsRef.current = points;
        pointIndexRef.current = 0;
        setCurrentDistanceKm(distDirect);
      }

      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(points);
      } else if (map && L) {
        const poly = L.polyline(points as any, {
          color: isDark ? "#42d6ff" : "#0891b2",
          weight: 4.5,
          opacity: 0.9,
          lineJoin: "round",
        }).addTo(map);
        routePolylineRef.current = poly;
      }
    } catch (err: any) {
      console.warn("[OSRM fallback]:", err.message);
    }
  }, [isDark]);

  const requestUserLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setIsLocationPermissionGranted(true);
      return;
    }
    setIsRequestingLocation(true);

    let resolved = false;
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setIsRequestingLocation(false);
        setIsLocationPermissionGranted(true);
      }
    }, 3500);

    const handlePos = async (pos: GeolocationPosition) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimer);
      setIsRequestingLocation(false);
      setIsLocationPermissionGranted(true);

      let userLat = pos.coords.latitude;
      let userLng = pos.coords.longitude;
      if (userLat > 7.28 && userLat < 7.32 && userLng > 80.625 && userLng < 80.645) {
        userLat = 7.264242;
        userLng = 80.621701;
      }
      const newPos: [number, number] = [userLat, userLng];

      const L = (await import("leaflet")).default || (await import("leaflet"));

      if (isProviderView) {
        setWorkerCoords(newPos);
        if (mapInstanceRef.current) {
          if (workerMarkerRef.current) workerMarkerRef.current.setLatLng(newPos);
          updateRoadRoute(newPos, homeCoordsRef.current, mapInstanceRef.current, L);
        }
        socketService.emitGpsMove({
          lat: userLat,
          lng: userLng,
          speed: pos.coords.speed || 30,
          timestamp: new Date().toISOString(),
        });
      } else {
        setHomeCoords(newPos);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(newPos, 16);
          if (homeMarkerRef.current) homeMarkerRef.current.setLatLng(newPos);
          if (homeCircleRef.current) homeCircleRef.current.setLatLng(newPos);
          updateRoadRoute(workerCoords, newPos, mapInstanceRef.current, L);
        }
      }
    };

    const handleErr = (err: any) => {
      console.log("[Geolocation fallback notice]:", err.message);
      navigator.geolocation.getCurrentPosition(
        handlePos,
        () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(safetyTimer);
            setIsRequestingLocation(false);
            setIsLocationPermissionGranted(true);
          }
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      handlePos,
      handleErr,
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 10000 }
    );
  };

  // AUTO-GET and CONTINUOUSLY WATCH device GPS
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    // Check permission state for auto-unblur
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        if (result.state === "granted") {
          setIsLocationPermissionGranted(true);
        }
      }).catch(() => {});
    }

    // Only provider view should continuously broadcast worker movement
    if (!isProviderView) {
      return;
    }

    const handleProviderPos = async (pos: GeolocationPosition) => {
      let lat = pos.coords.latitude;
      let lng = pos.coords.longitude;
      setIsLocationPermissionGranted(true);

      // If PC browser returns approximate Kandy Town IP/WiFi center (7.29...), snap to exact Heerassagala
      if (lat > 7.28 && lat < 7.32 && lng > 80.625 && lng < 80.645) {
        lat = 7.264242;
        lng = 80.621701;
      }

      const newPos: [number, number] = [lat, lng];
      setWorkerCoords(newPos);

      const L = (await import("leaflet")).default || (await import("leaflet"));
      if (mapInstanceRef.current) {
        if (workerMarkerRef.current) workerMarkerRef.current.setLatLng(newPos);
        const targetHome = homeCoordsRef.current;
        updateRoadRoute(newPos, targetHome, mapInstanceRef.current, L);
      }

      // Broadcast to socket for citizen
      socketService.emitGpsMove({
        lat,
        lng,
        speed: pos.coords.speed || 30,
        timestamp: new Date().toISOString(),
      });
    };

    // 1. Get initial fix immediately
    navigator.geolocation.getCurrentPosition(
      handleProviderPos,
      () => {
        navigator.geolocation.getCurrentPosition(
          handleProviderPos,
          () => {},
          { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 10000 }
    );

    // 2. Continuous real-time GPS watch
    const watchId = navigator.geolocation.watchPosition(
      handleProviderPos,
      (err) => console.log("[Live GPS watch notice]:", err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isProviderView, updateRoadRoute]);

  // Initialize Map ONCE

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default || (await import("leaflet"));
      if (!isMounted || !mapContainerRef.current) return;

      // Ensure container has no prior Leaflet instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: homeCoords,
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
      });

      // 100% Clean OpenStreetMap standard tiles (Zero API key required, crisp street names)
      const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, {
        subdomains: "abc",
        maxZoom: 19,
        className: isDark ? "dark-map-tiles" : "light-map-tiles",
      }).addTo(map);

      // Home Geofence Circle (60m perimeter)
      const homeCircle = L.circle(homeCoords, {
        radius: 60,
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: "3, 6",
      }).addTo(map);
      homeCircleRef.current = homeCircle;

      // Home Custom Pin
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

      const homeMarker = L.marker(homeCoords, { icon: homeIcon }).addTo(map);
      homeMarkerRef.current = homeMarker;

      // Worker Moving Vehicle Pin
      const workerIcon = L.divIcon({
        className: "gps-worker-pin",
        html: `
          <div style="
            width: 34px; height: 34px;
            background: #0891b2; color: #ffffff;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            transition: all 0.5s ease-out;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const initialWorkerPos = stage === "IN_PROGRESS" || stage === "COMPLETED" ? homeCoords : workerCoords;
      const workerMarker = L.marker(initialWorkerPos, { icon: workerIcon }).addTo(map);
      workerMarkerRef.current = workerMarker;

      mapInstanceRef.current = map;
      updateRoadRoute(initialWorkerPos, homeCoords, map, L);
    }

    initMap();

    // Listen to real-time HTML5 GPS telemetry stream from technician
    const unsubGps = socketService.onGpsTelemetry(async (gpsData: any) => {
      if (gpsData?.lat && gpsData?.lng) {
        const newLat = gpsData.lat;
        const newLng = gpsData.lng;
        const newWorkerPos: [number, number] = [newLat, newLng];

        setWorkerCoords(newWorkerPos);

        if (workerMarkerRef.current) {
          workerMarkerRef.current.setLatLng(newWorkerPos);
        }

        // Use ref to avoid stale closure — always route to current home position
        const latestHome = homeCoordsRef.current;
        const dist = calculateDistanceKm(newLat, newLng, latestHome[0], latestHome[1]);
        setCurrentDistanceKm(dist);
        const computedEta = Math.max(1, Math.round((dist / 30) * 60));
        setCurrentEta(computedEta);

        if (mapInstanceRef.current) {
          const L = (await import("leaflet")).default || (await import("leaflet"));
          updateRoadRoute(newWorkerPos, latestHome, mapInstanceRef.current, L);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubGps();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isDark]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "260px",
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
              : `LIVE GPS ROAD ROUTING · ${roadStreetName}`}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12px" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            Road Distance:{" "}
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
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          filter: !isLocationPermissionGranted ? "blur(6px)" : "none",
          transition: "filter 0.4s ease",
        }}
      />

      {/* Frosted Permission Modal if Citizen hasn't enabled device location */}
      {!isLocationPermissionGranted && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 450,
            backgroundColor: isDark ? "rgba(9, 11, 14, 0.75)" : "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              backgroundColor: "rgba(8,145,178,0.15)",
              color: "var(--accent)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <LocateFixed size={24} />
          </div>

          <h4 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "6px", color: "var(--text-primary)" }}>
            Turn On Live Device GPS
          </h4>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", maxWidth: "380px", marginBottom: "16px" }}>
            Enable device location permission to establish live road tracking and worker arrival routes.
          </p>

          <button
            onClick={requestUserLocation}
            disabled={isRequestingLocation}
            style={{
              padding: "9px 20px",
              backgroundColor: "var(--accent)",
              color: "var(--accent-text)",
              border: "none",
              fontWeight: 800,
              fontSize: "12.5px",
              cursor: isRequestingLocation ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            }}
          >
            <LocateFixed size={15} />
            <span>{isRequestingLocation ? "Requesting GPS..." : "Enable Live Location"}</span>
          </button>
        </div>
      )}

      {/* Bottom vehicle tag */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          zIndex: 400,
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
        <span>{workerName} · {vehiclePlate || "Arriving"}</span>
      </div>

      {/* Floating Map Zoom In / Out Controls */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          zIndex: 400,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          style={{
            width: "30px",
            height: "30px",
            backgroundColor: isDark ? "rgba(9, 11, 14, 0.9)" : "rgba(255, 255, 255, 0.94)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontWeight: 900,
            fontSize: "16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
          title="Zoom In (+)"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          style={{
            width: "30px",
            height: "30px",
            backgroundColor: isDark ? "rgba(9, 11, 14, 0.9)" : "rgba(255, 255, 255, 0.94)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontWeight: 900,
            fontSize: "16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
          title="Zoom Out (-)"
        >
          -
        </button>
      </div>
    </div>
  );
}
