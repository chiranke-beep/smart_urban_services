"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { AuthBackground } from "@/components/auth/AuthBackground";
import {
  Home,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  MapPin,
  Phone,
  User,
  Lock,
} from "lucide-react";

const SRI_LANKA_DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Ratnapura",
  "Kegalle",
];

export default function HomeownerRegisterPage() {
  const router = useRouter();
  const { registerHomeowner } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [locality, setLocality] = useState("");
  const [district, setDistrict] = useState("Colombo");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !locality.trim()) {
      setErrorMsg("Please fill in your name, contact phone, and town locality.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      await registerHomeowner({
        fullName: fullName.trim(),
        phone: phone.startsWith("+94") ? phone.trim() : `+94 ${phone.trim()}`,
        email: email.trim() || undefined,
        locality: locality.trim(),
        district,
        password,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to create account. Please try again.");
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
      <AuthBackground variant="citizen" />
      {/* ── Top Bar ── */}
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

      {/* ── Registration Form Card ── */}
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
            maxWidth: "520px",
            backgroundColor: "var(--card-bg)",
            border: "1.5px solid var(--border)",
            padding: "clamp(24px, 5vw, 36px)",
            borderRadius: "0px",
            boxShadow: isDark
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
              : "0 20px 40px -15px rgba(0, 0, 0, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
              Create Homeowner Account
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "6px 0 0 0" }}>
              Request verified painters, plumbers, tree cutters, and tech support in your town.
            </p>
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

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Anura Senanayake"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                  Mobile (SMS & WhatsApp)
                </label>
                <input
                  type="tel"
                  placeholder="077 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  District
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    backgroundColor: isDark ? "#090b0e" : "#ffffff",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 700,
                    outline: "none",
                  }}
                >
                  {SRI_LANKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                Town / Neighborhood Base
              </label>
              <input
                type="text"
                placeholder="Maharagama, Nugegoda, Peradeniya"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
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
                Create Password
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
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <span>Complete Homeowner Sign-Up</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Footer switch */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", textAlign: "center", fontSize: "12.5px" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 800, textDecoration: "underline" }}>
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer
        style={{
          padding: "16px 32px",
          borderTop: "1px solid var(--border)",
          fontSize: "11.5px",
          color: "var(--text-secondary)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Smart Urban Services Sri Lanka</span>
        <Link href="/register-provider" style={{ color: "var(--text-secondary)", textDecoration: "none", fontWeight: 700 }}>
          Are you a worker? Register here
        </Link>
      </footer>
    </div>
  );
}
