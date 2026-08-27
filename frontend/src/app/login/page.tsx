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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      await login({
        identifier: identifier.trim(),
        password: password,
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

          {/* Clean Email & Password Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. yourname@gmail.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1px solid var(--border)",
                  backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  fontWeight: 600,
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800 }}>Password</label>
              </div>
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1px solid var(--border)",
                  backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                  fontWeight: 600,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: "6px",
                padding: "12px",
                backgroundColor: "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(8,145,178,0.3)",
              }}
            >
              <span>{isSubmitting ? "Signing in..." : `Sign In as ${activeRole === "PROVIDER" ? "Worker" : "Citizen"}`}</span>
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
