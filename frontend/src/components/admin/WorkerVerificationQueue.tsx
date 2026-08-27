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
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("PENDING");
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredApps = applications.filter((a) => {
    if (filter === "PENDING") return a.status === "PENDING";
    if (filter === "APPROVED") return a.status === "APPROVED";
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
            Worker National ID & Trade Verification Queue ({filteredApps.length})
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
            Inspect official Sri Lankan National Identity Cards (NIC) and trade credentials to issue platform trust badges
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "PENDING", label: "Pending Approval" },
            { id: "APPROVED", label: "Verified & Active" },
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
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredApps.map((app) => {
            const isApproved = app.status === "APPROVED";

            return (
              <div
                key={app.id}
                style={{
                  padding: "20px 24px",
                  backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  border: isApproved ? "1.5px solid #10b981" : "1.5px solid var(--border)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "18px",
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

                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginTop: "2px" }}>
                      {app.trade} · {app.experienceYears} Years Experience
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
                      {app.vehicleType && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Truck size={13} />
                          <span>{app.plateNumber} ({app.vehicleType})</span>
                        </span>
                      )}
                      <span>Submitted {formatRelativeTime(app.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Inspection & Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              maxHeight: "90vh",
              overflowY: "auto",
              backgroundColor: isDark ? "#0b0f17" : "#ffffff",
              color: isDark ? "#ffffff" : "#0f172a",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e2e8f0",
              padding: "28px",
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
                  Official NIC & Skill Review: {selectedApp.fullName}
                </h3>
                <span style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.6)" : "#64748b" }}>
                  Registration ID: {selectedApp.id} · Applied {formatRelativeTime(selectedApp.submittedAt)}
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
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
                {selectedApp.nicFrontUrl ? (
                  <div
                    onClick={() => setZoomedNicUrl(selectedApp.nicFrontUrl || null)}
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "zoom-in",
                    }}
                    title="Click to view large full-size NIC image"
                  >
                    <div style={{ position: "relative", width: "100%" }}>
                      <img
                        src={selectedApp.nicFrontUrl}
                        alt="Uploaded National ID (NIC)"
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
                        🔍 Click to Enlarge
                      </div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: 700 }}>
                      NIC Front Document Attached
                    </div>
                  </div>
                ) : (
                  <>
                    <FileText size={28} color="#0284c7" />
                    <div style={{ fontSize: "13px", fontWeight: 800, color: isDark ? "#ffffff" : "#0f172a" }}>
                      Sri Lanka National ID (NIC)
                    </div>
                  </>
                )}
                <div style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.75)" : "#64748b" }}>
                  NIC Number: <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>{selectedApp.nicNumber}</strong>
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
                  Trade Skill Certification
                </div>
                <div style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.75)" : "#64748b" }}>
                  {selectedApp.trade} ({selectedApp.experienceYears} yrs experience)
                </div>
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>
                  ✓ Official Applicant Record
                </span>
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
                <span>Registered Service Base: <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>{selectedApp.locality}, {selectedApp.district}</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Phone size={14} color="#10b981" />
                <span>Contact Phone: <strong style={{ color: isDark ? "#ffffff" : "#0f172a" }}>{selectedApp.phone}</strong></span>
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
                  Revoke & Suspend Badge
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
                    Reject Application
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
                    Confirm & Issue Verified Badge
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
