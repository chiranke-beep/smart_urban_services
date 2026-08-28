"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Camera,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Cpu,
  Loader2,
  Trash2,
  DollarSign,
  Layers,
} from "lucide-react";
import { JobCategory, JobUrgency, JobRequest } from "@/types/job";
import {
  CATEGORY_DEFINITIONS,
  SRI_LANKA_DISTRICTS,
  POPULAR_LOCALITIES,
} from "@/utils/constants";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/api";
import { getCoordinatesForPlace } from "@/utils/geoDistance";

interface QuickJobPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitJob: (data: Omit<JobRequest, "id" | "createdAt" | "stage" | "stageUpdatedAt">) => void;
}

interface AIVisionResult {
  predicted_hazard: string;
  hazard_title: string;
  category: string;
  urgency: string;
  confidence_percentage: number;
  recommended_crew: string;
  required_equipment: string[];
  estimated_base_cost_lkr: number;
}

export function QuickJobPostModal({
  isOpen,
  onClose,
  onSubmitJob,
}: QuickJobPostModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory>("plumbing");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("Colombo");
  const [locality, setLocality] = useState("Maharagama");
  const [urgency, setUrgency] = useState<JobUrgency>("today");

  // Real Photo Upload & AI Scan State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiResult, setAiResult] = useState<AIVisionResult | null>(null);

  // Dynamic Pricing State
  const [estimatedCostLkr, setEstimatedCostLkr] = useState<number>(3850);
  const [priceRange, setPriceRange] = useState<{ min_lkr: number; max_lkr: number } | null>({
    min_lkr: 2500,
    max_lkr: 4500,
  });

  // AI Geo-Dispatch Spatial Specialist Match
  const [matchedProvider, setMatchedProvider] = useState<{
    id: string;
    name: string;
    trade: string;
    distance_km: number;
    estimated_arrival_minutes: number;
    composite_score: number;
    rating: number;
    verified: boolean;
  } | null>(null);
  const [isGeoMatching, setIsGeoMatching] = useState(false);

  const [gpsCoords, setGpsCoords] = useState<{ lat?: number; lng?: number }>({
    lat: 6.848,
    lng: 79.926,
  });

  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (isOpen && user) {
      const userDist = user.district || "Colombo";
      const userLoc = user.locality || "Maharagama";
      setDistrict(userDist);
      setLocality(userLoc);
      const coords = getCoordinatesForPlace(userLoc, userDist);
      setGpsCoords(coords || {
        lat: user.savedLat || 6.848,
        lng: user.savedLng || 79.926,
      });
    }
  }, [isOpen, user]);

  // Dynamically update GPS coordinates whenever citizen changes District or Locality
  useEffect(() => {
    if (district || locality) {
      const coords = getCoordinatesForPlace(locality, district);
      if (coords?.lat && coords?.lng) {
        setGpsCoords(coords);
      }
    }
  }, [district, locality]);

  // Recalculate AI Dynamic Cost & Geo-Dispatch whenever district, category, or urgency changes
  useEffect(() => {
    async function fetchAICostEstimate() {
      try {
        const urgMap: Record<JobUrgency, string> = {
          emergency: "CRITICAL",
          today: "HIGH",
          flexible: "MEDIUM",
        };

        const aiBase = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000";
        const res = await fetch(`${aiBase}/api/ai/predict-cost`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trade_category: selectedCategory,
            district: district,
            urgency: urgMap[urgency] || "MEDIUM",
            estimated_hours: urgency === "emergency" ? 3.0 : 2.0,
            materials_cost_lkr: 1000.0,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setEstimatedCostLkr(data.total_estimated_lkr);
          setPriceRange(data.price_range);
        }
      } catch (err) {
        setEstimatedCostLkr(3850);
      }
    }

    async function fetchGeoDispatchMatch() {
      setIsGeoMatching(true);
      try {
        const res = await apiClient<{ success: boolean; recommendations?: any[] }>("/ai/geo-dispatch", {
          method: "POST",
          body: JSON.stringify({
            incident_lat: gpsCoords.lat || 6.9271,
            incident_lng: gpsCoords.lng || 79.8612,
            required_category: selectedCategory,
            max_radius_km: 35.0,
          }),
        });

        if (res?.recommendations && res.recommendations.length > 0) {
          setMatchedProvider(res.recommendations[0]);
        } else {
          setMatchedProvider(null);
        }
      } catch (err) {
        console.warn("[Geo Dispatch Match Error]:", err);
      } finally {
        setIsGeoMatching(false);
      }
    }

    if (isOpen) {
      fetchAICostEstimate();
      fetchGeoDispatchMatch();
    }
  }, [isOpen, selectedCategory, district, urgency, gpsCoords]);

  if (!isOpen) return null;

  // Handle Real File Input Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setImagePreview(base64Data);
      setIsAiScanning(true);
      setAiResult(null);

      try {
        const aiBase = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000";
        const res = await fetch(`${aiBase}/api/ai/vision-scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            description: title || description,
          }),
        });

        if (res.ok) {
          const data: AIVisionResult = await res.json();
          setAiResult(data);

          // 1. Auto-generate smart Job Title
          const smartTitles: Record<string, string> = {
            potholes: "Road Pothole & Cavity Patching Required",
            wall_cracks: "Masonry Wall Crack & Plaster Sealant Repair",
            fallen_trees: "Fallen Tree & Obstructing Timber Removal",
            water_leaks: "Water Pipeline Joint Leak & Pressure Sealing",
            pc_repair: "Laptop Hardware & Circuitry Diagnostic Repair",
            yard_cleaning: "Yard Cleaning, Leaf Raking & Garden Clearance",
            house_cleaning: "Home Deep Cleaning & Surface Pressure Wash",
          };
          const generatedTitle = smartTitles[data.predicted_hazard] || data.hazard_title || "Urban Service Incident";
          setTitle(generatedTitle);

          // 2. Auto-generate smart Detailed Work Requirements
          const smartDescriptions: Record<string, string> = {
            potholes: `[AI Vision Diagnostic - ${data.confidence_percentage}% Confidence]\nIdentified severe road cavity defect. Recommended crew: ${data.recommended_crew}. Required gear: ${data.required_equipment?.join(", ") || "Asphalt plate compactor, cold tar mix"}. Immediate patching requested.`,
            wall_cracks: `[AI Vision Diagnostic - ${data.confidence_percentage}% Confidence]\nIdentified structural/plaster surface fracture. Recommended specialist: ${data.recommended_crew}. Required gear: ${data.required_equipment?.join(", ") || "Crack sealant, putty spatula, sanding block"}. Needs surface sealing and paint touchup.`,
            fallen_trees: `[AI Vision Diagnostic - ${data.confidence_percentage}% Confidence]\nIdentified fallen tree branches/timber debris obstructing the area. Recommended crew: ${data.recommended_crew}. Required gear: ${data.required_equipment?.join(", ") || "Chainsaw, winch, barricades"}. Immediate timber clearing needed.`,
            water_leaks: `[AI Vision Diagnostic - ${data.confidence_percentage}% Confidence]\nIdentified pipe defect and fluid seepage. Recommended technician: ${data.recommended_crew}. Required gear: ${data.required_equipment?.join(", ") || "Pipe wrench, Teflon tape, PPR welder"}. Needs rapid joint welding & pressure seal.`,
            pc_repair: `[AI Vision Diagnostic - ${data.confidence_percentage}% Match]\nIdentified computer/laptop hardware component issue. Recommended technician: ${data.recommended_crew}. Required tools: ${data.required_equipment?.join(", ") || "Precision tools, multimeter"}. Diagnostics and repair requested.`,
            yard_cleaning: `[AI Vision Diagnostic - ${data.confidence_percentage}% Match]\nIdentified dry leaves and garden waste buildup. Recommended worker: ${data.recommended_crew}. Required tools: ${data.required_equipment?.join(", ") || "Leaf rake, heavy yard broom, disposal bags"}. Yard clearing & garden cleanup requested.`,
            house_cleaning: `[AI Vision Diagnostic - ${data.confidence_percentage}% Match]\nIdentified surface deep cleaning & washing requirement. Recommended crew: ${data.recommended_crew}. Required gear: ${data.required_equipment?.join(", ") || "Pressure washer, scrubbers"}. Deep cleaning service requested.`,
          };
          setDescription(smartDescriptions[data.predicted_hazard] || `AI Vision verified: ${data.hazard_title}. Please dispatch verified local workers.`);

          // 3. Auto-suggest category
          if (data.category) {
            setSelectedCategory(data.category as JobCategory);
          }

          // 4. Auto-suggest urgency
          if (data.urgency === "HIGH" || data.urgency === "CRITICAL" || data.predicted_hazard === "fallen_trees" || data.predicted_hazard === "potholes") {
            setUrgency("emergency");
          } else {
            setUrgency("today");
          }
        }
      } catch (err) {
        console.warn("AI Vision scan error:", err);
      } finally {
        setIsAiScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setImagePreview(null);
    setAiResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmitJob({
      title,
      category: selectedCategory,
      description: description || (aiResult ? `[AI Vision Diagnosed: ${aiResult.hazard_title}]` : "Direct request dispatched to verified local workers."),
      district,
      locality,
      latitude: gpsCoords.lat,
      longitude: gpsCoords.lng,
      urgency,
      photos: imagePreview ? [imagePreview] : [],
      costLKR: estimatedCostLkr || (aiResult?.estimated_base_cost_lkr) || 3500,
      citizenName: user?.fullName || "Citizen",
      citizenPhone: user?.phone || "+94 77 123 4567",
    });

    onClose();
  };

  const availableLocalities = POPULAR_LOCALITIES[district] || ["Town Center", "Main Road"];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(8px, 2vw, 20px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          maxHeight: "94vh",
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          border: isDark ? "1.5px solid var(--accent)" : "1.5px solid #0891b2",
          boxShadow: isDark
            ? "0 25px 60px -15px rgba(0, 0, 0, 0.8)"
            : "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          borderRadius: "0px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: isDark ? "1px solid var(--border)" : "1.5px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? "#1e293b" : "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: "var(--accent)",
                color: "var(--accent-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
              }}
            >
              <Plus size={16} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "15px",
                  fontWeight: 900,
                  color: isDark ? "#ffffff" : "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Publish New Service Request
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "none",
              border: "none",
              color: isDark ? "#cbd5e1" : "#334155",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "clamp(14px, 2.5vw, 22px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
          }}
        >
          {/* 1. Category Selector Grid */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12.5px",
                fontWeight: 800,
                color: isDark ? "#f1f5f9" : "#0f172a",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              1. Select Service Category:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px" }}>
              {CATEGORY_DEFINITIONS.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as JobCategory)}
                    style={{
                      padding: "12px 8px",
                      borderRadius: "0px",
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(255,255,255,0.08)"
                          : `${cat.color}15`
                        : isDark
                        ? "rgba(255,255,255,0.02)"
                        : "#f8fafc",
                      border: isSelected
                        ? `2px solid ${cat.color}`
                        : isDark
                        ? "1px solid var(--border)"
                        : "1.5px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      textAlign: "center",
                    }}
                  >
                    <Icon size={20} color={cat.color} />
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: isSelected ? 800 : 700,
                        color: isDark
                          ? isSelected ? "#ffffff" : "#cbd5e1"
                          : "#0f172a",
                      }}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Job Title */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                2. Job Title / Summary:
              </label>
              {aiResult && (
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={12} /> Auto-filled by AI
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Broken water pipe leaking in front lawn"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "0px",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                border: isDark ? "1px solid var(--border)" : "1.5px solid #cbd5e1",
                color: isDark ? "#f8fafc" : "#0f172a",
                fontSize: "13px",
                outline: "none",
                fontWeight: 600,
              }}
            />
          </div>

          {/* 3. Detailed Description */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12.5px",
                fontWeight: 800,
                color: isDark ? "#f1f5f9" : "#0f172a",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              3. Detailed Description & Work Requirements:
            </label>
            <textarea
              rows={3}
              placeholder="Describe work area, power line hazards, specific tools required, or property access instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "0px",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                border: isDark ? "1px solid var(--border)" : "1.5px solid #cbd5e1",
                color: isDark ? "#f8fafc" : "#0f172a",
                fontSize: "13px",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* 4. District & Locality */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                }}
              >
                District:
              </label>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  const locs = POPULAR_LOCALITIES[e.target.value];
                  if (locs && locs.length > 0) setLocality(locs[0]);
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "0px",
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  border: isDark ? "1px solid var(--border)" : "1.5px solid #cbd5e1",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                }}
              >
                Locality / Town:
              </label>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "0px",
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  border: isDark ? "1px solid var(--border)" : "1.5px solid #cbd5e1",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {availableLocalities.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Urgency Selector */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12.5px",
                fontWeight: 800,
                color: isDark ? "#f1f5f9" : "#0f172a",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              5. Urgency Level:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
              {[
                { id: "emergency", label: "Emergency / Hazard", desc: "Within 30-45 mins", color: "#ef4444" },
                { id: "today", label: "Needed Today", desc: "Within 2-4 hours", color: "#f59e0b" },
                { id: "flexible", label: "Flexible / This Week", desc: "Schedule as needed", color: "#06b6d4" },
              ].map((u) => {
                const isSelected = urgency === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUrgency(u.id as JobUrgency)}
                    style={{
                      padding: "10px",
                      borderRadius: "0px",
                      backgroundColor: isSelected
                        ? isDark ? `${u.color}20` : `${u.color}15`
                        : isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                      border: isSelected
                        ? `2px solid ${u.color}`
                        : isDark ? "1px solid var(--border)" : "1.5px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 800, color: isSelected ? u.color : isDark ? "#f8fafc" : "#0f172a" }}>
                      {u.label}
                    </div>
                    <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b", marginTop: "2px" }}>
                      {u.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Real Interactive Photo Upload & AI Computer Vision Scanner */}
          <div
            style={{
              padding: "16px",
              border: isDark ? "1.5px dashed var(--accent)" : "1.5px dashed #0891b2",
              backgroundColor: isDark ? "rgba(8,145,178,0.05)" : "#f0fdfa",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Camera size={22} color={isDark ? "var(--accent)" : "#0891b2"} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a" }}>
                    {imagePreview ? "Photo Uploaded" : "Add a Photo of the Problem (Optional)"}
                  </div>
                  <div style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b" }}>
                    Upload a photo to automatically find the problem with AI
                  </div>
                </div>
              </div>

              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "0px",
                    backgroundColor: "var(--accent)",
                    border: "none",
                    color: "var(--accent-text)",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Camera size={14} />
                  Choose File...
                </button>
              ) : (
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "0px",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              )}
            </div>

            {/* Preview and AI Result Card */}
            {imagePreview && (
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginTop: "4px" }}>
                {/* Thumbnail */}
                <div style={{ width: "90px", height: "90px", position: "relative", flexShrink: 0 }}>
                  <img
                    src={imagePreview}
                    alt="Upload Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      border: isDark ? "1px solid var(--border)" : "1px solid #cbd5e1",
                    }}
                  />
                  {isAiScanning && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Loader2 size={24} color="#06b6d4" className="animate-spin" />
                    </div>
                  )}
                </div>

                {/* AI Diagnostics */}
                <div style={{ flex: 1 }}>
                  {isAiScanning ? (
                    <div style={{ fontSize: "12.5px", color: isDark ? "#06b6d4" : "#0891b2", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                      <Cpu size={16} className="animate-spin" />
                      Scanning photo with AI...
                    </div>
                  ) : aiResult ? (
                    <div
                      style={{
                        padding: "10px 12px",
                        backgroundColor: isDark ? "#1e293b" : "#ffffff",
                        border: "1px solid #10b981",
                        borderRadius: "0px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 900, color: "#10b981", display: "flex", alignItems: "center", gap: "5px" }}>
                          <CheckCircle2 size={15} />
                          AI Found: {aiResult.hazard_title}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 6px", backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                          {aiResult.confidence_percentage}% Match
                        </span>
                      </div>

                      <div style={{ fontSize: "11.5px", color: isDark ? "#cbd5e1" : "#475569" }}>
                        Recommended Worker: <strong>{aiResult.recommended_crew}</strong>
                      </div>

                      <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>
                        Tools Needed: {aiResult.required_equipment?.join(", ")}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* 7. Live AI Dynamic Fair Cost Estimation Card */}
          <div
            style={{
              padding: "14px 16px",
              backgroundColor: isDark ? "rgba(245,158,11,0.08)" : "#fffbeb",
              border: isDark ? "1px solid rgba(245,158,11,0.3)" : "1.5px solid #fde68a",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#f59e0b",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                }}
              >
                Rs
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: isDark ? "#fef3c7" : "#92400e" }}>
                  Estimated Price ({district} District)
                </div>
                <div style={{ fontSize: "11px", color: isDark ? "#fde68a" : "#b45309" }}>
                  Price Range: Rs. {priceRange ? `${priceRange.min_lkr.toLocaleString()} - ${priceRange.max_lkr.toLocaleString()}` : "2,500 - 4,500"}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#f59e0b" }}>
                Rs. {estimatedCostLkr ? estimatedCostLkr.toLocaleString() : "3,850"}
              </div>
              <div style={{ fontSize: "10px", color: isDark ? "#94a3b8" : "#64748b" }}>
                AI Suggested
              </div>
            </div>
          </div>

          {/* 8. AI Nearest Specialist Match (geo_dispatcher.pkl) */}
          {matchedProvider && (
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: isDark ? "rgba(6,182,212,0.08)" : "#ecfeff",
                border: isDark ? "1px solid rgba(6,182,212,0.35)" : "1.5px solid #a5f3fc",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#06b6d4", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Sparkles size={14} />
                  AI Top Matched Specialist (Geo-Dispatch)
                </span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#10b981", padding: "2px 6px", backgroundColor: "rgba(16,185,129,0.15)" }}>
                  {matchedProvider.composite_score}% Match
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: isDark ? "#ffffff" : "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{matchedProvider.name}</span>
                    {matchedProvider.verified && (
                      <span style={{ fontSize: "10px", color: "#10b981", display: "flex", alignItems: "center", gap: "2px" }}>
                        <ShieldCheck size={13} /> Verified
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b" }}>
                    {matchedProvider.trade.split(",")[0]}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: isDark ? "#38bdf8" : "#0284c7", fontWeight: 700 }}>
                    <MapPin size={14} />
                    <span>{matchedProvider.distance_km} km</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10b981", fontWeight: 700 }}>
                    <Clock size={14} />
                    <span>~{matchedProvider.estimated_arrival_minutes} min arrival</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: "0px",
              backgroundColor: "var(--accent)",
              border: "none",
              color: "var(--accent-text)",
              fontSize: "14px",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 4px 14px rgba(8,145,178,0.3)",
              fontFamily: "inherit",
              marginTop: "4px",
            }}
          >
            <span>Post Job & Find Workers</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
