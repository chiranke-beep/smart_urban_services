"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { JobCategory, JobUrgency, JobRequest } from "@/types/job";
import {
  CATEGORY_DEFINITIONS,
  SRI_LANKA_DISTRICTS,
  POPULAR_LOCALITIES,
} from "@/utils/constants";
import { useTheme } from "@/components/ThemeProvider";

interface QuickJobPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitJob: (data: Omit<JobRequest, "id" | "createdAt" | "stage" | "stageUpdatedAt">) => void;
}

export function QuickJobPostModal({
  isOpen,
  onClose,
  onSubmitJob,
}: QuickJobPostModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<JobCategory>("tree-cutting");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("Colombo");
  const [locality, setLocality] = useState("Maharagama");
  const [urgency, setUrgency] = useState<JobUrgency>("today");
  const [hasPhoto, setHasPhoto] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmitJob({
      title,
      category: selectedCategory,
      description: description || "Direct request dispatched to verified local workers.",
      district,
      locality,
      urgency,
      photos: hasPhoto ? ["hazard_evidence_photo.jpg"] : [],
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
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
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
            padding: "20px 24px",
            borderBottom: isDark ? "1px solid var(--border)" : "1px solid #e2e8f0",
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "var(--accent)",
                color: "var(--accent-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "16px",
              }}
            >
              +
            </div>
            <div>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: isDark ? "#f8fafc" : "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Publish New Service Request
              </h2>
              <p
                style={{
                  fontSize: "12.5px",
                  color: isDark ? "#94a3b8" : "#475569",
                  margin: "2px 0 0 0",
                  fontWeight: 500,
                }}
              >
                Broadcast directly to verified local workers with zero commission fees
              </p>
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
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
          }}
        >
          {/* 1. Category Selector Grid */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 800,
                color: isDark ? "#f1f5f9" : "#0f172a",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              1. Select Service Category:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {CATEGORY_DEFINITIONS.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as JobCategory)}
                    style={{
                      padding: "14px 10px",
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
                      boxShadow: isSelected
                        ? `0 4px 12px ${cat.color}25`
                        : "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Icon size={22} color={cat.color} strokeWidth={2.2} />
                    <span
                      style={{
                        fontSize: "12.5px",
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
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 800,
                color: isDark ? "#f1f5f9" : "#0f172a",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              2. Job Title / Summary:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2 Coconut trees need climbing & high branch pruning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "0px",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                border: isDark ? "1px solid var(--border)" : "1.5px solid #cbd5e1",
                color: isDark ? "#f8fafc" : "#0f172a",
                fontSize: "14px",
                fontWeight: 600,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* 3. Detailed Description */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
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
                padding: "12px 14px",
                borderRadius: "0px",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                border: isDark ? "1px solid var(--border)" : "1.5px solid #cbd5e1",
                color: isDark ? "#f8fafc" : "#0f172a",
                fontSize: "13.5px",
                outline: "none",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* 4. District & Locality Selection */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                District:
              </label>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setLocality(POPULAR_LOCALITIES[e.target.value]?.[0] || "Town Center");
                }}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "0px",
                  backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                  border: isDark ? "1px solid var(--border)" : "1.5px solid #cbd5e1",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Locality / Town:
              </label>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "0px",
                  backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                  border: isDark ? "1px solid var(--border)" : "1.5px solid #cbd5e1",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                {availableLocalities.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Urgency Selection */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 800,
                color: isDark ? "#f1f5f9" : "#0f172a",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              5. Urgency Level:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {[
                { id: "emergency", label: "Emergency Leak / Storm", desc: "Worker within 30m", icon: AlertTriangle, iconColor: "#ef4444" },
                { id: "today", label: "Needed Today", desc: "Within 2-4 hours", icon: Zap, iconColor: isDark ? "#42d6ff" : "#0891b2" },
                { id: "flexible", label: "Flexible / This Week", desc: "Coordinate via chat", icon: Clock, iconColor: "#6366f1" },
              ].map((u) => {
                const isSelected = urgency === u.id;
                const UrgencyIcon = u.icon;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUrgency(u.id as JobUrgency)}
                    style={{
                      padding: "12px",
                      borderRadius: "0px",
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(66,214,255,0.12)"
                          : "rgba(8,145,178,0.12)"
                        : isDark
                        ? "rgba(255,255,255,0.02)"
                        : "#f8fafc",
                      border: isSelected
                        ? isDark
                          ? "1.5px solid var(--accent)"
                          : "2px solid #0891b2"
                        : isDark
                        ? "1px solid var(--border)"
                        : "1.5px solid #e2e8f0",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: isSelected
                          ? isDark ? "var(--accent)" : "#0891b2"
                          : isDark ? "#f1f5f9" : "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <UrgencyIcon size={14} color={u.iconColor} />
                      <span>{u.label}</span>
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: isDark ? "#94a3b8" : "#475569",
                        marginTop: "4px",
                        fontWeight: 600,
                      }}
                    >
                      {u.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Photo attachment simulator */}
          <div
            style={{
              padding: "14px 18px",
              border: isDark ? "1.5px dashed var(--border)" : "1.5px dashed #94a3b8",
              backgroundColor: hasPhoto
                ? isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)"
                : isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Camera size={22} color={hasPhoto ? "#10b981" : isDark ? "var(--accent)" : "#0891b2"} />
              <div>
                <div
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 800,
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                >
                  {hasPhoto ? "✓ Photo Attached: hazard_evidence_01.jpg" : "Attach Work Area / Hazard Photo"}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: isDark ? "#94a3b8" : "#64748b",
                    marginTop: "2px",
                  }}
                >
                  Workers quote 40% faster when photos are provided
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHasPhoto(!hasPhoto)}
              style={{
                padding: "8px 14px",
                borderRadius: "0px",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                border: isDark ? "1px solid var(--border)" : "1.5px solid #cbd5e1",
                color: isDark ? "#f8fafc" : "#0f172a",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {hasPhoto ? "Remove" : "+ Add Sample Photo"}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: "0px",
              backgroundColor: "var(--accent)",
              color: "var(--accent-text)",
              border: "none",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 4px 16px var(--accent-glow)",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <span>Broadcast Job to Local Workers</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
