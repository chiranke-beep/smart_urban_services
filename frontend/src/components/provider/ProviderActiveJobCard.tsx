"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  MessageSquare,
  MapPin,
  Clock,
  Navigation,
  CheckCircle,
  Truck,
  ArrowRight,
  ShieldCheck,
  Banknote,
  Landmark,
  Edit3,
  Check,
} from "lucide-react";
import { JobRequest } from "@/types/job";
import { LiveGpsRouteMap } from "@/components/citizen/LiveGpsRouteMap";
import { formatCurrency, formatETA } from "@/utils/formatters";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { jobService } from "@/services/jobService";

interface ProviderActiveJobCardProps {
  job: JobRequest;
  onOpenChat: (jobId: string) => void;
  onAdvanceStage: (jobId: string, stage: JobRequest["stage"]) => void;
  onUpdateQuote?: (jobId: string, amountLKR: number) => void;
}

export function ProviderActiveJobCard({
  job,
  onOpenChat,
  onAdvanceStage,
  onUpdateQuote,
}: ProviderActiveJobCardProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const [isEditingPrice, setIsEditingPrice] = useState(false);
  // displayPrice tracks the live price and stays in sync with parent prop
  const [displayPrice, setDisplayPrice] = useState(job.costLKR || job.quotation?.amountLKR || 3500);
  const [editedPrice, setEditedPrice] = useState(job.costLKR || job.quotation?.amountLKR || 3500);

  // Sync when parent job prop is updated (e.g. after socket update)
  useEffect(() => {
    const latestPrice = job.costLKR || job.quotation?.amountLKR || 3500;
    setDisplayPrice(latestPrice);
    setEditedPrice(latestPrice);
  }, [job.costLKR, job.quotation?.amountLKR]);

  const handleSavePrice = () => {
    const updated = jobService.updateQuotation(job.id, editedPrice, user?.fullName);
    if (updated) {
      setDisplayPrice(editedPrice);
    }
    if (onUpdateQuote) {
      onUpdateQuote(job.id, editedPrice);
    }
    setIsEditingPrice(false);
  };

  return (
    <div
      style={{
        padding: "clamp(16px, 3.5vw, 28px)",
        borderRadius: "0px",
        backgroundColor: "var(--card-bg)",
        border: "1.5px solid #10b981",
        boxShadow: "0 16px 36px -10px rgba(16,185,129,0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "relative",
      }}
    >
      {/* Top Status & Real Homeowner Address */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              backgroundColor: "rgba(16,185,129,0.15)",
              color: "#10b981",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981", borderRadius: "50%" }} />
            Active Job
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Status: {job.stage === "QUOTED" ? "Price Quoted" : job.stage === "EN_ROUTE" ? "On the way" : job.stage === "IN_PROGRESS" ? "Working" : job.stage === "COMPLETED" ? "Finished" : "Requested"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "var(--text-primary)", fontWeight: 700 }}>
          <MapPin size={15} color="#10b981" />
          <span>{job.address || `${job.locality}, ${job.district}`}</span>
        </div>
      </div>

      {/* Main Job Title & Description */}
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "8px",
          }}
        >
          {job.title}
        </h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
          {job.description}
        </p>
      </div>

      {/* Live GPS Route Map */}
      <LiveGpsRouteMap
        workerName={user?.fullName || "You (Technician)"}
        vehiclePlate={user?.plateNumber || "WP-ABX-8821"}
        locality={job.locality}
        homeLat={job.latitude}
        homeLng={job.longitude}
        etaMinutes={job.etaMinutes || 15}
        stage={job.stage}
        isProviderView={true}
        onGeofenceArrival={() => onAdvanceStage(job.id, "IN_PROGRESS")}
      />

      {/* Direct Settlement & Quotation Renegotiation Bar */}
      <div
        style={{
          marginTop: "20px",
          padding: "18px 20px",
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          border: "1px solid var(--border)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 800, marginBottom: "4px" }}>
            Quoted Direct Payout (Zero Platform Commission)
          </div>

          {isEditingPrice ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "16px", fontWeight: 800 }}>Rs.</span>
              <input
                type="number"
                value={editedPrice}
                onChange={(e) => setEditedPrice(Number(e.target.value))}
                style={{
                  width: "120px",
                  padding: "6px 10px",
                  fontSize: "16px",
                  fontWeight: 800,
                  backgroundColor: "var(--bg)",
                  border: "1.5px solid var(--accent)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
              <button
                onClick={handleSavePrice}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Check size={14} />
                <span>Update Quote</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#10b981" }}>
                {formatCurrency(displayPrice)}
              </div>
              <button
                onClick={() => setIsEditingPrice(true)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Edit3 size={12} />
                <span>Negotiate / Edit Price</span>
              </button>
            </div>
          )}

          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Payment Mode: {job.paymentMethod} · Direct Cash on Hand or Bank Transfer
          </div>
        </div>

        {/* Homeowner Communication Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => onOpenChat(job.id)}
            style={{
              padding: "10px 18px",
              borderRadius: "0px",
              backgroundColor: "var(--accent)",
              color: "var(--accent-text)",
              border: "none",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <MessageSquare size={16} />
            <span>Chat Homeowner</span>
          </button>

          <a
            href="tel:+94771234567"
            style={{
              padding: "10px 16px",
              borderRadius: "0px",
              backgroundColor: "transparent",
              border: "1.5px solid var(--border)",
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <PhoneCall size={15} />
            <span>Call Homeowner</span>
          </a>
        </div>
      </div>

      {/* Technician Stage Advance Actions */}
      <div
        style={{
          marginTop: "16px",
          padding: "14px 18px",
          backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)",
          border: "1.5px solid rgba(16,185,129,0.3)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <ShieldCheck size={18} color="#10b981" />
          <span>
            <strong>Current Status:</strong>{" "}
            {job.stage === "QUOTED"
              ? "Quotation sent. Awaiting homeowner price confirmation or negotiation."
              : job.stage === "EN_ROUTE"
              ? `Travelling to customer property in ${job.locality}`
              : job.stage === "IN_PROGRESS"
              ? "On site at property. Task underway."
              : "Job completed & settled."}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {job.stage === "EN_ROUTE" && (
            <button
              onClick={() => onAdvanceStage(job.id, "IN_PROGRESS")}
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
              <span>I Have Arrived at Location</span>
              <ArrowRight size={14} />
            </button>
          )}

          {job.stage === "IN_PROGRESS" && (
            <button
              onClick={() => onAdvanceStage(job.id, "COMPLETED")}
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
              <CheckCircle size={15} />
              <span>Mark Job Finished & Collect Payment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
