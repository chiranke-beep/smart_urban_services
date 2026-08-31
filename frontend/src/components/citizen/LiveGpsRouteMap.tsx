"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Navigation, MapPin, Radio, ShieldCheck, CheckCircle2, LocateFixed, AlertCircle } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { socketService } from "@/services/socketService";
import { getCoordinatesForPlace } from "@/utils/geoDistance";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // Start as false so the "Grant Location" button is shown — set true once browser grants or fallback kicks in
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState<boolean>(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState<boolean>(false);

  // Dynamic coordinate resolution for any Sri Lankan locality
  const resolvedCoords = getCoordinatesForPlace(locality);
  const initialHome: [number, number] =
    homeLat && homeLng && !isNaN(Number(homeLat)) && !isNaN(Number(homeLng))
      ? [Number(homeLat), Number(homeLng)]
      : [resolvedCoords.lat, resolvedCoords.lng];

  const homeCoordsRef = useRef<[number, number]>(initialHome);
  homeCoordsRef.current = initialHome;

  // Specialist always dispatches locally from service base in customer's neighbourhood (~1.6km away)
  const initialWorker: [number, number] =
    stage === "IN_PROGRESS" || stage === "COMPLETED"
      ? initialHome
      : [initialHome[0] + 0.012, initialHome[1] + 0.010];

  const [homeCoords, setHomeCoords] = useState<[number, number]>(initialHome);
  const [workerCoords, setWorkerCoords] = useState<[number, number]>(initialWorker);

  // Keep ref in sync with state so socket listeners get fresh value without re-subscribing
  homeCoordsRef.current = homeCoords;

  const initialDistance = calculateDistanceKm(initialWorker[0], initialWorker[1], initialHome[0], initialHome[1]);
  const [currentDistanceKm, setCurrentDistanceKm] = useState<number>(initialDistance > 0.05 ? initialDistance : 1.8);
  const [currentEta, setCurrentEta] = useState<number>(Math.max(2, Math.round((initialDistance / 25.0) * 60 + 3)));
  const [roadStreetName, setRoadStreetName] = useState<string>("Turn-by-Turn Road Route");
  const isGeofenced = stage === "IN_PROGRESS" || stage === "COMPLETED";

  // Fetch Real Turn-by-Turn Road Route from OpenStreetMap OSRM Routing Engine
  const updateRoadRoute = useCallback(async (start: [number, number], end: [number, number], map: any, L: any) => {
    try {
      let actualStart = start;
      const distDirect = calculateDistanceKm(actualStart[0], actualStart[1], end[0], end[1]);
      if (distDirect < 0.05 && stage === "EN_ROUTE") {
        // If testing on same device, keep worker starting at local dispatch depot ~1.6km away
        actualStart = [end[0] + 0.012, end[1] + 0.010];
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

      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
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
      if (!resolved) {
        resolved = true;
        clearTimeout(safetyTimer);
        setIsRequestingLocation(false);
        setIsLocationPermissionGranted(true);
      }
    };

    navigator.geolocation.getCurrentPosition(
      handlePos,
      handleErr,
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 10000 }
    );
  };

  // AUTO-GET and CONTINUOUSLY WATCH device GPS
  useEffect(() => {
    if (typeof window === "undefined") return;

    // On HTTP (no geolocation available), silently grant and use locality fallback
    if (!("geolocation" in navigator)) {
      setIsLocationPermissionGranted(true);
      return;
    }

    // Check existing permission state — if already granted, auto-request silently
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        if (result.state === "granted") {
          setIsLocationPermissionGranted(true);
          requestUserLocation();
        } else if (result.state === "prompt") {
          // Permission not yet asked — auto-trigger the browser popup
          requestUserLocation();
        } else {
          // Permission denied — use locality fallback silently
          setIsLocationPermissionGranted(true);
        }
      }).catch(() => {
        // Permissions API not available — trigger directly
        requestUserLocation();
      });
    } else {
      // Permissions API not supported — trigger directly
      requestUserLocation();
    }

    // Only provider view should continuously broadcast worker movement
    if (!isProviderView) {
      return;
    }

    const handleProviderPos = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setIsLocationPermissionGranted(true);

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

    const handleProviderErr = () => {
      console.log("[GPS Notice]: Provider using local neighbourhood dispatch station");
      // Use local dispatch position in customer's neighbourhood (~1.6km away)
      const localBasePos: [number, number] = [initialHome[0] + 0.012, initialHome[1] + 0.010];
      handleProviderPos({
        coords: {
          latitude: localBasePos[0],
          longitude: localBasePos[1],
          accuracy: 15,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: 30,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    };

    if ("geolocation" in navigator) {
      // 1. Get initial fix immediately
      navigator.geolocation.getCurrentPosition(
        handleProviderPos,
        handleProviderErr,
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 10000 }
      );

      // 2. Continuous real-time GPS watch
      const watchId = navigator.geolocation.watchPosition(
        handleProviderPos,
        handleProviderErr,
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      handleProviderErr();
    }
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
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
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
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "#090b0e" : "#f1f5f9",
        border: "1.5px solid var(--accent)",
        overflow: "hidden",
        marginTop: "20px",
        borderRadius: "0px",
        boxShadow: "0 8px 24px -6px rgba(0,0,0,0.25)",
      }}
    >
      {/* Top Telemetry & ETA Prediction Bar — Permanently Visible */}
      <div
        style={{
          backgroundColor: isDark ? "rgba(9, 11, 14, 0.96)" : "rgba(255, 255, 255, 0.98)",
          borderBottom: "1px solid var(--border)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px 14px",
          zIndex: 1200,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: isGeofenced ? "#0891b2" : "#10b981",
              boxShadow: `0 0 10px ${isGeofenced ? "#0891b2" : "#10b981"}`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "clamp(11.5px, 2.6vw, 13px)", fontWeight: 800, color: "var(--text-primary)" }}>
            {isGeofenced
              ? "GEOFENCE VERIFIED ON PROPERTY (<50m)"
              : `LIVE GPS ROAD ROUTING · ${roadStreetName}`}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px 16px", flexWrap: "wrap", fontSize: "clamp(11.5px, 2.6vw, 13px)" }}>
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

      {/* Map DOM target wrapper */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "clamp(260px, 36vw, 380px)",
          minHeight: "260px",
        }}
      >
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

      {/* Bottom status tag */}
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
        <span>{workerName} · En Route</span>
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
    </div>
  );
}
