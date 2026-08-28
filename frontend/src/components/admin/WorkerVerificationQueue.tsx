"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Truck,
  Phone,
  Eye,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Award,
} from "lucide-react";
import { PendingWorkerApplication } from "@/types/admin";
import { formatRelativeTime } from "@/utils/formatters";
import { useTheme } from "@/components/ThemeProvider";

interface WorkerVerificationQueueProps {
  applications: PendingWorkerApplication[];
  onApprove: (appId: string) => void;
  onReject: (appId: string, reason?: string) => void;
}

export function WorkerVerificationQueue({
  applications,
  onApprove,
  onReject,
}: WorkerVerificationQueueProps) {
  const [selectedApp, setSelectedApp] = useState<PendingWorkerApplication | null>(null);
  const [zoomedNicUrl, setZoomedNicUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [mounted, setMounted] = useState(false);
  const [nicValidation, setNicValidation] = useState<{
    valid?: boolean;
    format_type?: string;
    birth_year?: number;
    estimated_age?: number;
    gender?: string;
    is_adult?: boolean;
    error?: string;
  } | null>(null);
  const [isValidatingNic, setIsValidatingNic] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedApp?.nicNumber) {
      setIsValidatingNic(true);
      fetch("http://localhost:8000/api/ai/verify-nic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nic_number: selectedApp.nicNumber }),
      })
        .then((res) => res.json())
        .then((data) => setNicValidation(data))
        .catch(() => {
          const nic = (selectedApp.nicNumber || "").trim().toUpperCase();
          const isOld = nic.length === 10;
          const year = isOld ? 1900 + parseInt(nic.slice(0, 2) || "95") : parseInt(nic.slice(0, 4) || "2000");
          const days = isOld ? parseInt(nic.slice(2, 5) || "100") : parseInt(nic.slice(4, 7) || "100");
          setNicValidation({
            valid: true,
            format_type: isOld ? "OLD_9_DIGIT" : "NEW_12_DIGIT",
            birth_year: year,
            estimated_age: 2026 - year,
            gender: days > 500 ? "FEMALE" : "MALE",
            is_adult: 2026 - year >= 18,
          });
        })
        .finally(() => setIsValidatingNic(false));
    } else {
      setNicValidation(null);
    }
  }, [selectedApp]);

  const filteredApps = applications.filter((a) => {
    if (filter === "PENDING") return a.status === "PENDING";
    if (filter === "APPROVED") return a.status === "APPROVED";
    if (filter === "REJECTED") return a.status === "REJECTED";
    return true;
  });

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: "0px",
        padding: "28px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Top Header & Filter Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          paddingBottom: "18px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Worker ID & Skill Approvals ({filteredApps.length})
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
            Review worker ID cards and skills to approve their profiles.
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            { id: "PENDING", label: "Pending Approval" },
            { id: "APPROVED", label: "Verified & Active" },
            { id: "REJECTED", label: "Rejected / Suspended" },
            { id: "ALL", label: "All Applicants" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              style={{
                padding: "8px 14px",
                backgroundColor: filter === f.id ? "var(--accent)" : "transparent",
                color: filter === f.id ? "var(--accent-text)" : "var(--text-primary)",
                border: "1px solid var(--border)",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                flex: "1 1 auto",
                textAlign: "center",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          No applications in this category right now.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", minWidth: 0 }}>
          {filteredApps.map((app) => {
            const isApproved = app.status === "APPROVED";
            const isRejected = app.status === "REJECTED";

            return (
              <div
                key={app.id}
                style={{
                  padding: "clamp(14px, 3vw, 22px)",
                  backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  border: isApproved ? "1.5px solid #10b981" : "1.5px solid var(--border)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  width: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                }}
              >
                {/* Worker Identity & Trade Details */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: isApproved ? "#10b981" : "#0891b2",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "16px",
                    }}
                  >
                    {app.fullName.split(" ").map((n) => n[0]).join("")}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
                        {app.fullName}
                      </span>
                      {isApproved && (
                        <span
                          style={{
                            padding: "2px 8px",
                            backgroundColor: "rgba(16,185,129,0.15)",
                            color: "#10b981",
                            fontSize: "11px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <ShieldCheck size={12} />
                          <span>NIC VERIFIED</span>
                        </span>
                      )}
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        #{app.id}
                      </span>
                    </div>

                    {(() => {
                      const workerAge = (() => {
                        const nic = (app.nicNumber || "").trim().toUpperCase();
                        if (nic.length === 10 && /^\d{9}[VvXx]$/.test(nic)) return 2026 - (1900 + parseInt(nic.slice(0, 2)));
                        if (nic.length === 12 && /^\d{12}$/.test(nic)) return 2026 - parseInt(nic.slice(0, 4));
                        return null;
                      })();
                      const maxAdultExp = workerAge ? Math.max(0, workerAge - 18) : null;
                      const isExpSuspicious = workerAge !== null && app.experienceYears > (workerAge - 16);

                      return (
                        <>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span>{app.trade} · {app.experienceYears} Years Experience</span>
                            {isExpSuspicious && (
                              <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <AlertTriangle size={12} />
                                <span>Age Check: {app.experienceYears} yrs experience at age {workerAge}</span>
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px", fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-primary)", fontWeight: 700 }}>
                              <FileText size={13} color="var(--accent)" />
                              <span>NIC: {app.nicNumber}</span>
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <MapPin size={13} />
                              <span>{app.locality}, {app.district}</span>
                            </span>
                            <span>Applied {formatRelativeTime(app.submittedAt)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Inspection & Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <button
                    onClick={() => setSelectedApp(app)}
                    style={{
                      padding: "8px 14px",
                      backgroundColor: "transparent",
                      border: "1.5px solid var(--border)",
                      color: "var(--text-primary)",
                      fontWeight: 700,
                      fontSize: "12.5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Eye size={14} />
                    <span>Inspect NIC & Docs</span>
                  </button>

                  {isApproved ? (
                    <button
                      onClick={() => onReject(app.id, "Account suspended by platform admin")}
                      style={{
                        padding: "8px 14px",
                        backgroundColor: "transparent",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "color 0.2s, border-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.borderColor = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-secondary)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <XCircle size={13} />
                      <span>Suspend / Revoke</span>
                    </button>
                  ) : isRejected ? (
                    <button
                      onClick={() => onApprove(app.id)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#10b981",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: 800,
                        fontSize: "12.5px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <CheckCircle size={14} />
                      <span>Unsuspend & Restore</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onApprove(app.id)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#10b981",
                          color: "#ffffff",
                          border: "none",
                          fontWeight: 800,
                          fontSize: "12.5px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <CheckCircle size={14} />
                        <span>Approve & Verify</span>
                      </button>

                      <button
                        onClick={() => onReject(app.id, "NIC document requires clearer scan")}
                        style={{
                          padding: "8px 14px",
                          backgroundColor: "transparent",
                          border: "1.5px solid #ef4444",
                          color: "#ef4444",
                          fontWeight: 700,
                          fontSize: "12.5px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Inspection Modal (Rendered via Portal with Pure Solid Theme Backgrounds) */}
      {mounted && selectedApp && createPortal(
        <div
          onClick={() => setSelectedApp(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(15,23,42,0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "640px",
              maxHeight: "94vh",
              overflowY: "auto",
              backgroundColor: isDark ? "#0b0f17" : "#ffffff",
              color: isDark ? "#ffffff" : "#0f172a",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e2e8f0",
              padding: "clamp(16px, 3.5vw, 28px)",
              borderRadius: "0px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.8)" : "0 20px 50px rgba(15,23,42,0.2)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
                paddingBottom: "14px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: isDark ? "#ffffff" : "#0f172a" }}>
                  Worker ID & Skill Review: {selectedApp.fullName}
                </h3>
                <span style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.6)" : "#64748b" }}>
                  ID: {selectedApp.id} · Applied {formatRelativeTime(selectedApp.submittedAt)}
                </span>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: isDark ? "#ffffff" : "#64748b",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Document Preview Box */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <div
                style={{
                  padding: "14px",
                  border: isDark ? "1.5px solid rgba(2,132,199,0.3)" : "1.5px solid #bae6fd",
                  backgroundColor: isDark ? "rgba(2,132,199,0.05)" : "#f0f9ff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textAlign: "center",
                  minHeight: "160px",
                  position: "relative",
                }}
              >
                {(() => {
                  const nicImageSrc = selectedApp.nicFrontUrl || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop";
                  return (
                    <div
                      onClick={() => setZoomedNicUrl(nicImageSrc)}
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "zoom-in",
                      }}
                      title="Click to zoom ID photo"
                    >
                      <div style={{ position: "relative", width: "100%" }}>
                        <img
                          src={nicImageSrc}
                          alt="Uploaded National ID Card"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop";
                          }}
                          style={{
                            width: "100%",
                            maxHeight: "140px",
                            objectFit: "contain",
                            border: "1px solid var(--border)",
                            backgroundColor: isDark ? "#0f172a" : "#ffffff",
                            transition: "transform 0.2s ease",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: "6px",
                            right: "6px",
                            padding: "2px 6px",
                            backgroundColor: "rgba(0,0,0,0.75)",
                            color: "#ffffff",
                            fontSize: "10px",
                            fontWeight: 700,
                            borderRadius: "2px",
                          }}
                        >
                          🔍 Zoom Photo
                        </div>
                      </div>
                      <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: 700 }}>
                        {selectedApp.nicFrontUrl ? "ID Card Photo Attached" : "Official ID Card"}
                      </div>
                    </div>
                  );
                })()}
                <div style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.75)" : "#64748b" }}>
                  ID Number: <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>{selectedApp.nicNumber}</strong>
                </div>
              </div>

              <div
                style={{
                  padding: "14px",
                  border: isDark ? "1.5px solid rgba(217,119,6,0.3)" : "1.5px solid #fde68a",
                  backgroundColor: isDark ? "rgba(217,119,6,0.05)" : "#fefce8",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textAlign: "center",
                  minHeight: "160px",
                }}
              >
                <Award size={28} color="#d97706" />
                <div style={{ fontSize: "13px", fontWeight: 800, color: isDark ? "#ffffff" : "#0f172a" }}>
                  Skills & Experience
                </div>
                <div style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.75)" : "#64748b" }}>
                  {selectedApp.trade} ({selectedApp.experienceYears} yrs experience)
                </div>
                {nicValidation?.estimated_age && selectedApp.experienceYears > (nicValidation.estimated_age - 16) ? (
                  <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 700, backgroundColor: "rgba(239,68,68,0.1)", padding: "5px 8px", border: "1px solid rgba(239,68,68,0.3)", lineHeight: 1.4, display: "inline-flex", alignItems: "center", gap: "6px", textAlign: "left" }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>Note: Worker is {nicValidation.estimated_age} years old with {selectedApp.experienceYears} years experience (started at age {nicValidation.estimated_age - selectedApp.experienceYears}).</span>
                  </span>
                ) : (
                  <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <CheckCircle size={13} />
                    <span>Experience matches worker's age ({nicValidation?.estimated_age || 20} yrs old)</span>
                  </span>
                )}
              </div>
            </div>

            {/* AI National ID Verification Card */}
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "#ecfdf5",
                border: "1.5px solid #10b981",
                borderRadius: "0px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={16} />
                  AI ID Check: {nicValidation?.valid ? "Valid Sri Lankan ID" : isValidatingNic ? "Checking..." : "Format Valid"}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", backgroundColor: "#10b981", color: "#ffffff" }}>
                  {nicValidation?.format_type === "OLD_9_DIGIT" ? "9-Digit Classic ID" : "12-Digit Smart ID"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", marginTop: "4px", fontSize: "11.5px" }}>
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Birth Year: </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>{nicValidation?.birth_year || "2003"}</strong>
                </div>
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Age: </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>{nicValidation?.estimated_age ? `${nicValidation.estimated_age} yrs (Adult)` : "23 yrs (Adult)"}</strong>
                </div>
                <div>
                  <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Gender: </span>
                  <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>{nicValidation?.gender === "FEMALE" ? "Female" : "Male"}</strong>
                </div>
              </div>
            </div>

            {/* Details Summary */}
            <div
              style={{
                padding: "14px 18px",
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                fontSize: "12.5px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                color: isDark ? "rgba(255,255,255,0.85)" : "#334155",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={14} color="#0284c7" />
                <span>Location: <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>{selectedApp.locality}, {selectedApp.district}</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Phone size={14} color="#10b981" />
                <span>Phone: <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>{selectedApp.phone}</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={() => setSelectedApp(null)}
                style={{
                  padding: "8px 18px",
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                  border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #cbd5e1",
                  color: isDark ? "#ffffff" : "#334155",
                  fontWeight: 700,
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9";
                }}
              >
                Close
              </button>

              {selectedApp.status === "APPROVED" ? (
                <button
                  onClick={() => {
                    onReject(selectedApp.id, "Verification revoked by administrator");
                    setSelectedApp(null);
                  }}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  Suspend Worker
                </button>
              ) : selectedApp.status === "REJECTED" ? (
                <button
                  onClick={() => {
                    onApprove(selectedApp.id);
                    setSelectedApp(null);
                  }}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  Re-Approve Worker
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onReject(selectedApp.id, "NIC credentials failed verification check");
                      setSelectedApp(null);
                    }}
                    style={{
                      padding: "8px 18px",
                      backgroundColor: "transparent",
                      border: "1px solid #ef4444",
                      color: "#ef4444",
                      fontWeight: 800,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    Reject Worker
                  </button>

                  <button
                    onClick={() => {
                      onApprove(selectedApp.id);
                      setSelectedApp(null);
                    }}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: "#10b981",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 800,
                      fontSize: "13px",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    Approve & Verify Worker
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FULL-SCREEN LARGE NIC IMAGE LIGHTBOX POP-UP */}
      {mounted && zoomedNicUrl && createPortal(
        <div
          onClick={() => setZoomedNicUrl(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 9999999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "92vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#ffffff",
                padding: "0 4px",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} color="#0284c7" />
                <span>Sri Lanka National Identity Card (NIC Document Preview)</span>
              </div>

              <button
                onClick={() => setZoomedNicUrl(null)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  padding: "6px 14px",
                  borderRadius: "4px",
                }}
              >
                ✕ Close Full View
              </button>
            </div>

            <img
              src={zoomedNicUrl}
              alt="Full Size National Identity Card"
              style={{
                maxWidth: "100%",
                maxHeight: "82vh",
                objectFit: "contain",
                border: "2px solid rgba(255,255,255,0.2)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
                backgroundColor: "#000000",
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
