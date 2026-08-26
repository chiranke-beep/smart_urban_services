"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { AuthBackground } from "@/components/auth/AuthBackground";
import {
  Home,
  Wrench,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Zap,
  UserCheck,
  Layers,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [activeRole, setActiveRole] = useState<"HOMEOWNER" | "PROVIDER">("HOMEOWNER");
  const [authMode, setAuthMode] = useState<"PHONE" | "EMAIL">("PHONE");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg("Please enter your Sri Lankan phone number (+94 7X XXX XXXX)");
      return;
    }
    setErrorMsg("");
    setOtpSent(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      await login({
        identifier: identifier.trim(),
        password: authMode === "EMAIL" ? password : undefined,
        otp: authMode === "PHONE" ? otpCode : undefined,
        role: activeRole,
      });

      if (activeRole === "PROVIDER") {
        router.push("/provider/dashboard");
      } else {
        router.push("/citizen/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      <AuthBackground variant={activeRole === "PROVIDER" ? "provider" : "citizen"} />
      {/* ── Top Header ── */}
      <header
        style={{
          height: "64px",
          padding: "0 clamp(16px, 4vw, 40px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--card-bg)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "var(--text-primary)",
          }}
        >
          <span style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "-0.03em" }}>
            Smart Urban<span style={{ color: "var(--accent)" }}>.</span>
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            padding: "6px 12px",
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          <span>{isDark ? "Light" : "Dark"}</span>
        </button>
      </header>

      {/* ── Main Auth Card ── */}
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
            maxWidth: "480px",
            backgroundColor: "var(--card-bg)",
            border: "1.5px solid var(--border)",
            padding: "clamp(24px, 5vw, 36px)",
            borderRadius: "0px",
            boxShadow: isDark
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
              : "0 20px 40px -15px rgba(0, 0, 0, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Header */}
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              Sign In
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "6px 0 0 0" }}>
              Sign in to manage household service requests or receive dispatch orders.
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              padding: "4px",
              border: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveRole("HOMEOWNER");
                setErrorMsg("");
                setOtpSent(false);
              }}
              style={{
                padding: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backgroundColor: activeRole === "HOMEOWNER" ? "var(--accent)" : "transparent",
                color: activeRole === "HOMEOWNER" ? "var(--accent-text)" : "var(--text-primary)",
                border: "none",
                fontWeight: 800,
                fontSize: "12.5px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Home size={15} />
              <span>Homeowner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole("PROVIDER");
                setErrorMsg("");
                setOtpSent(false);
              }}
              style={{
                padding: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backgroundColor: activeRole === "PROVIDER" ? "var(--accent)" : "transparent",
                color: activeRole === "PROVIDER" ? "var(--accent-text)" : "var(--text-primary)",
                border: "none",
                fontWeight: 800,
                fontSize: "12.5px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Wrench size={15} />
              <span>Service Provider</span>
            </button>
          </div>

          {/* Auth Mode Toggle */}
          <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
            <button
              type="button"
              onClick={() => setAuthMode("PHONE")}
              style={{
                background: "none",
                border: "none",
                fontSize: "12.5px",
                fontWeight: authMode === "PHONE" ? 800 : 600,
                color: authMode === "PHONE" ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 0",
                position: "relative",
              }}
            >
              <Phone size={13} />
              <span>Sri Lankan Phone (SMS OTP)</span>
              {authMode === "PHONE" && (
                <div style={{ position: "absolute", bottom: "-11px", left: 0, right: 0, height: "2px", backgroundColor: "var(--accent)" }} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setAuthMode("EMAIL")}
              style={{
                background: "none",
                border: "none",
                fontSize: "12.5px",
                fontWeight: authMode === "EMAIL" ? 800 : 600,
                color: authMode === "EMAIL" ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 0",
                position: "relative",
              }}
            >
              <Mail size={13} />
              <span>Email & Password</span>
              {authMode === "EMAIL" && (
                <div style={{ position: "absolute", bottom: "-11px", left: 0, right: 0, height: "2px", backgroundColor: "var(--accent)" }} />
              )}
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid #ef4444",
                color: "#ef4444",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={authMode === "PHONE" && !otpSent ? handleSendOtp : handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {authMode === "PHONE" ? (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                    Sri Lanka Mobile Number
                  </label>
                  <div style={{ display: "flex", border: "1px solid var(--border)", backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff" }}>
                    <span style={{ padding: "10px 12px", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", fontSize: "13px", fontWeight: 800, borderRight: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
                      +94
                    </span>
                    <input
                      type="tel"
                      placeholder="77 123 4567"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={otpSent}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        outline: "none",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 800 }}>
                        Enter 6-Digit SMS Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Change Number
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="582194"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        border: "1.5px solid var(--accent)",
                        backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                        color: "var(--text-primary)",
                        fontSize: "18px",
                        letterSpacing: "0.2em",
                        fontWeight: 900,
                        textAlign: "center",
                        outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#10b981", marginTop: "6px", fontWeight: 700 }}>
                      <Check size={13} />
                      <span>Demo SMS pass ready: enter any 6 digits (e.g. 123456)</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@domain.lk"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid var(--border)",
                      backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                      color: "var(--text-primary)",
                      fontSize: "13.5px",
                      outline: "none",
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid var(--border)",
                      backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                      color: "var(--text-primary)",
                      fontSize: "13.5px",
                      outline: "none",
                      fontWeight: 600,
                    }}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: "8px",
                padding: "13px 20px",
                backgroundColor: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                fontSize: "14px",
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 6px 20px var(--accent-glow)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <span>
                {authMode === "PHONE" && !otpSent
                  ? "Send SMS OTP Verification"
                  : `Sign In as ${activeRole === "HOMEOWNER" ? "Homeowner" : "Worker"}`}
              </span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Footer Register Links */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "12.5px",
              textAlign: "center",
            }}
          >
            {activeRole === "HOMEOWNER" ? (
              <div>
                Don&apos;t have an account?{" "}
                <Link href="/citizen/register" style={{ color: "var(--accent)", fontWeight: 800, textDecoration: "underline" }}>
                  Create Homeowner Account
                </Link>
              </div>
            ) : (
              <div>
                Are you a skilled technician or tree cutter?{" "}
                <Link href="/provider/register" style={{ color: "var(--accent)", fontWeight: 800, textDecoration: "underline" }}>
                  Register as Verified Worker (4 Steps)
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: "16px 32px",
          borderTop: "1px solid var(--border)",
          fontSize: "11.5px",
          color: "var(--text-secondary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Smart Urban Services Sri Lanka</span>
        <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontWeight: 700 }}>
          Back to Directory
        </Link>
      </footer>
    </div>
  );
}
