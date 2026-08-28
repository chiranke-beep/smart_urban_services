"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  Send,
  X,
  AlertTriangle,
  Zap,
  CheckCircle,
  FileText,
  DollarSign,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { JobRequest, Quotation } from "@/types/job";
import { formatCurrency, formatRelativeTime } from "@/utils/formatters";
import { CATEGORY_DEFINITIONS } from "@/utils/constants";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { getAiDistanceAndEta } from "@/utils/geoDistance";

interface IncomingJobCardProps {
  job: JobRequest;
  hasActiveJob?: boolean;
  isVerified?: boolean;
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  onSendQuote: (jobId: string, quote: Omit<Quotation, "id" | "workerId" | "workerName" | "avatarBg" | "submittedAt" | "status">) => void;
  onDecline: (jobId: string) => void;
  onNavigateToActiveJob?: () => void;
}

export function IncomingJobCard({
  job,
  hasActiveJob = false,
  isVerified = true,
  verificationStatus = "PENDING",
  rejectionReason,
  onSendQuote,
  onDecline,
  onNavigateToActiveJob,
}: IncomingJobCardProps) {
  const { user } = useAuth();
  const [isQuoting, setIsQuoting] = useState(false);
  const aiRecommendedPrice = Number(job.costLKR || 3500);
  const [amount, setAmount] = useState<number>(aiRecommendedPrice);
  const [rateType, setRateType] = useState<"fixed" | "daily" | "per_unit">("fixed");
  const [notes, setNotes] = useState("");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Calculate live accurate AI Haversine distance from worker location
  const { distanceLabel, etaMinutes } = getAiDistanceAndEta(
    { lat: job.latitude, lng: job.longitude, locality: job.locality, district: job.district },
    { lat: user?.savedLat, lng: user?.savedLng, locality: user?.locality, district: user?.district }
  );

  useEffect(() => {
    if (job.costLKR) {
      setAmount(Number(job.costLKR));
    }
  }, [job.costLKR]);

  const categoryInfo = CATEGORY_DEFINITIONS.find((c) => c.id === job.category) || CATEGORY_DEFINITIONS[1];
  const CategoryIcon = categoryInfo.icon;

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendQuote(job.id, {
      amountLKR: amount,
      rateType,
      notes: notes || "Includes standard equipment, full cut, and compound waste clearing.",
    });
    setIsQuoting(false);
  };

  return (
    <div
      style={{
        padding: "clamp(16px, 3.5vw, 24px)",
        borderRadius: "0px",
        backgroundColor: "var(--card-bg)",
        border: `1.5px solid ${categoryInfo.color}`,
        boxShadow: `0 12px 30px -10px ${categoryInfo.color}25`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      {/* Top Banner: Category, Urgency, Distance */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          paddingBottom: "14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: `${categoryInfo.color}15`,
              color: categoryInfo.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CategoryIcon size={18} />
          </div>

          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
              {categoryInfo.name}
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
              Broadcasted {formatRelativeTime(job.createdAt)}
            </div>
          </div>
        </div>

        {/* Urgency & Distance Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              padding: "4px 10px",
              backgroundColor: job.urgency === "emergency" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
              color: job.urgency === "emergency" ? "#ef4444" : "#10b981",
              fontSize: "12px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {job.urgency === "emergency" ? <AlertTriangle size={12} /> : <Zap size={12} />}
            <span>{job.urgency.toUpperCase()}</span>
          </span>

          <span
            style={{
              padding: "4px 10px",
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: "var(--text-primary)",
              fontSize: "12px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <MapPin size={12} color="var(--accent)" />
            <span>{job.locality} ({distanceLabel} · ~{etaMinutes} min arrival)</span>
          </span>
        </div>
      </div>

      {/* Main Job Title & Description */}
      <div>
        <h3
          style={{
            fontSize: "19px",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: "0 0 8px 0",
            letterSpacing: "-0.01em",
          }}
        >
          {job.title}
        </h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
          {job.description}
        </p>
      </div>

      {/* Photo evidence tag if provided */}
      {job.photos && job.photos.length > 0 && (
        <div
          style={{
            padding: "8px 14px",
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
            border: "1px dashed var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--text-primary)",
            fontWeight: 600,
          }}
        >
          <FileText size={15} color="#10b981" />
          <span>Citizen attached hazard photo for pre-inspection</span>
        </div>
      )}

      {/* Quote Builder Form or Action Buttons */}
      {isQuoting ? (
        <form
          onSubmit={handleQuoteSubmit}
          style={{
            padding: "16px",
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
            border: "1.5px solid var(--accent)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text-primary)" }}>
            Send Official Quotation to Citizen:
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700 }}>
                  Amount (LKR):
                </label>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Sparkles size={12} /> AI Recommended: Rs. {aiRecommendedPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                required
                min={100}
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontWeight: 700,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Rate Type:
              </label>
              <select
                value={rateType}
                onChange={(e) => setRateType(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontWeight: 700,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="fixed">Fixed Price for Full Job</option>
                <option value="daily">Per Day Rate</option>
                <option value="per_unit">Per Tree / Unit</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
              Work Notes / Gear Included:
            </label>
            <input
              type="text"
              placeholder="e.g. Telescoping chainsaw, safety climbing ropes, and branch clearance included."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
            <button
              type="button"
              onClick={() => setIsQuoting(false)}
              style={{
                padding: "8px 16px",
                backgroundColor: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: "12.5px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: "8px 18px",
                backgroundColor: "#10b981",
                color: "#ffffff",
                border: "none",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Send size={14} />
              <span>Send Quote ({formatCurrency(amount)})</span>
            </button>
          </div>
        </form>
      ) : (
        hasActiveJob ? (
          <div
            style={{
              padding: "14px 18px",
              backgroundColor: isDark ? "rgba(234, 179, 8, 0.12)" : "#fefce8",
              border: isDark ? "1.5px solid #eab308" : "1.5px solid #facc15",
              color: isDark ? "#fef08a" : "#854d0e",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={20} color="#eab308" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: "13px", color: isDark ? "#fef08a" : "#854d0e" }}>
                  Active Job In Progress (1 Simultaneous Job Limit)
                </div>
                <div style={{ fontSize: "11.5px", fontWeight: 500, opacity: 0.9, marginTop: "2px", color: isDark ? "#fef9c3" : "#a16207" }}>
                  You are currently handling an active dispatch. You cannot accept or quote on other jobs until your current task is completed.
                </div>
              </div>
            </div>

            {onNavigateToActiveJob && (
              <button
                type="button"
                onClick={onNavigateToActiveJob}
                style={{
                  padding: "8px 14px",
                  backgroundColor: "#eab308",
                  color: "#000000",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  flexShrink: 0,
                }}
              >
                <span>Go to Active Job</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        ) : verificationStatus === "REJECTED" ? (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1.5px solid #ef4444",
              color: isDark ? "#fca5a5" : "#b91c1c",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800 }}>Account Suspended by Admin</div>
              <div style={{ fontSize: "11.5px", fontWeight: 500, opacity: 0.9, marginTop: "2px" }}>
                {rejectionReason ? `Your service provider account has been suspended: ${rejectionReason}. Please contact admin to appeal and restore access.` : "Your service provider account has been suspended by administration. Contact admin to resolve and restore access."}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {!isVerified && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: isDark ? "#fde68a" : "#b45309",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ShieldCheck size={15} color="#f59e0b" />
                <span>Verification in Progress — You can preview, quote, and accept local dispatches.</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setIsQuoting(true)}
                style={{
                  flex: 1,
                  padding: "12px 18px",
                  borderRadius: "0px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: "13.5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <DollarSign size={16} />
                <span>Send Quotation & Accept Request</span>
              </button>

              <button
                onClick={() => onDecline(job.id)}
                style={{
                  padding: "12px 18px",
                  borderRadius: "0px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "13.5px",
                }}
              >
                Decline
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
