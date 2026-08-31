"use client";

import React, { useEffect, useRef } from "react";

interface InteractivePinPickerProps {
  lat: number;
  lng: number;
  onChangeCoords: (newLat: number, newLng: number) => void;
  isDark: boolean;
  height?: string;
}

export function InteractivePinPicker({
  lat,
  lng,
  onChangeCoords,
  isDark,
  height = "240px",
}: InteractivePinPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isSubscribed = true;

    import("leaflet").then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Free OpenStreetMap tile server
      const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Sleek 22x30 SVG location pin
      const smallPinIcon = L.divIcon({
        className: "custom-small-pin",
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 30px;
            cursor: grab;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
          ">
            <svg width="22" height="30" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="#10b981"/>
              <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
            </svg>
          </div>
        `,
        iconSize: [22, 30],
        iconAnchor: [11, 30],
      });

      const marker = L.marker([lat, lng], {
        icon: smallPinIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // Drag event
      marker.on("dragend", (e: any) => {
        const position = e.target.getLatLng();
        onChangeCoords(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)));
      });

      // Click to place pin anywhere on map
      map.on("click", (e: any) => {
        const clickedLat = Number(e.latlng.lat.toFixed(6));
        const clickedLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([clickedLat, clickedLng]);
        map.panTo([clickedLat, clickedLng]);
        onChangeCoords(clickedLat, clickedLng);
      });

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker & map center position when props change
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng], { animate: true });
    }
  }, [lat, lng]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: "0px",
        overflow: "hidden",
        border: "1.5px solid var(--border)",
      }}
    >
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", zIndex: 1 }} />
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "8px",
          zIndex: 400,
          backgroundColor: isDark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.92)",
          padding: "4px 8px",
          fontSize: "11px",
          color: "var(--text-secondary)",
          backdropFilter: "blur(4px)",
          border: "1px solid var(--border)",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>📍 Click or drag pin to set exact service location</span>
      </div>
    </div>
  );
}
