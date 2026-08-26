"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { AuthBackground } from "@/components/auth/AuthBackground";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  Key,
  ShieldCheck,
  Zap,
  Terminal,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [staffId, setStaffId] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim()) {
      setErrorMsg("Please enter your registered Staff ID (e.g. STF-COL-8890).");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      await adminLogin(staffId.trim(), securityKey);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid staff authorization credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#06080b" : "#0f172a",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "inherit",
        position: "relative",
      }}
    >
      <AuthBackground variant="admin" />
      {/* ── Top Bar ── */}
      <header
        style={{
          height: "64px",
          padding: "0 clamp(16px, 4vw, 40px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "#ffffff",
          }}
        >
          <span style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "-0.03em" }}>
            Smart Urban<span style={{ color: "#ef4444" }}>.</span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 700, marginLeft: "8px" }}>
              Admin Portal
            </span>
          </span>
        </Link>

        <Link
          href="/"
          style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Back to Directory
        </Link>
      </header>

      {/* ── Main Secure Auth Form ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          className="auth-card-animate"
          style={{
            width: "100%",
            maxWidth: "460px",
            backgroundColor: "#0b0f17",
            border: "1.5px solid rgba(255,255,255,0.15)",
            padding: "clamp(24px, 5vw, 36px)",
            borderRadius: "0px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
              Admin Sign In
            </h1>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
              Enter your staff credentials to access worker verification and dispatch telemetry.
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                color: "#fca5a5",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "rgba(255,255,255,0.8)", marginBottom: "6px" }}>
                Staff ID / Badge Identifier
              </label>
              <input
                type="text"
                placeholder="STF-COL-8890"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  outline: "none",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "rgba(255,255,255,0.8)", marginBottom: "6px" }}>
                Console Security Key / PIN
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  outline: "none",
                  fontWeight: 700,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: "6px",
                padding: "13px 20px",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                fontSize: "13.5px",
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 6px 20px rgba(239,68,68,0.3)",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <span>Authenticate & Enter Console</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </main>

      <footer
        style={{
          padding: "16px 32px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: "11.5px",
          color: "rgba(255,255,255,0.4)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Platform Ops Security Architecture · Sri Lanka</span>
        <span>Build v2.4</span>
      </footer>
    </div>
  );
}
