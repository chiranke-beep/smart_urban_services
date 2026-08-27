"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Radio,
  Heart,
  MessageSquare,
  Sparkles,
  MapPin,
  Laptop,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";

export function Footer() {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const isDark = theme === "dark";

  return (
    <footer
      style={{
        position: "relative",
        width: "100%",
        backgroundColor: isDark ? "#06080b" : "#e2e8f0",
        borderTop: "1px solid var(--border)",
        padding: "80px 48px 40px",
        transition: "background-color 0.4s ease",
      }}
    >
      <div style={{ width: "100%", margin: "0 auto" }}>

        {/* ── Top Grid (4 Columns) ─────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr",
            gap: "40px",
            marginBottom: "60px",
          }}
        >
          {/* Col 1: Brand & Mission */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  backgroundColor: "var(--accent)",
                  borderRadius: "0px",
                }}
              />
              <span style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
                Smart Urban Services
              </span>
            </div>

            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.7,
                color: "var(--text-secondary)",
                marginBottom: "24px",
                maxWidth: "340px",
              }}
            >
              Sri Lanka&apos;s community-first platform connecting house owners with skilled village
              craftsmen, freelance technicians, and local volunteers. Direct in-app communication, zero
              brokerage.
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
                border: "1px solid var(--border)",
                borderRadius: "0px",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              <span style={{ width: "8px", height: "8px", backgroundColor: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              <span>Real-Time WebSocket Grid: Active</span>
            </div>
          </div>

          {/* Col 2: Services Directory */}
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: "20px",
              }}
            >
              Services Directory
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Home Painting & Finishing", href: "#services" },
                { label: "Tree Cutting & Yard Clearing", href: "#services" },
                { label: "Emergency Plumbing & Pumps", href: "#services" },
                { label: "Tile Roof & Deep Cleaning", href: "#services" },
                { label: "PC, Laptop & Hardware Repair", href: "#services" },
                { label: "Community Volunteer Aid", href: "#services" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{
                      fontSize: "15px",
                      color: "var(--text-secondary)",
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Platform Portals */}
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: "20px",
              }}
            >
              Portals & Access
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {isAuthenticated && user ? (
                <>
                  <li>
                    <Link
                      href={
                        user.role === "ADMIN"
                          ? "/admin/dashboard"
                          : user.role === "PROVIDER"
                          ? "/provider/dashboard"
                          : "/citizen/dashboard"
                      }
                      style={{
                        fontSize: "15px",
                        color: "var(--accent)",
                        fontWeight: 700,
                        textDecoration: "none",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {user.role === "ADMIN"
                        ? "Operations Console"
                        : user.role === "PROVIDER"
                        ? "Dispatch Console"
                        : "Resident Console"}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#workers-map"
                      style={{
                        fontSize: "15px",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                    >
                      Interactive Sri Lanka Radar
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#reviews"
                      style={{
                        fontSize: "15px",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                    >
                      Verified Community Reviews
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#how-it-works"
                      style={{
                        fontSize: "15px",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                    >
                      How It Works (3 Steps)
                    </Link>
                  </li>
                </>
              ) : (
                [
                  { label: "House Owner Sign In", href: "/login" },
                  { label: "Worker & Technician Gate", href: "/login" },
                  { label: "Register as a Provider", href: "/provider/register" },
                  { label: "Interactive Sri Lanka Radar", href: "#workers-map" },
                  { label: "Verified Community Reviews", href: "#reviews" },
                  { label: "How It Works (3 Steps)", href: "#how-it-works" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "15px",
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Col 4: Worker Registration CTA Box */}
          <div
            style={{
              padding: "24px",
              borderRadius: "0px",
              backgroundColor: isDark ? "rgba(18, 24, 38, 0.85)" : "#ffffff",
              border: "1.5px solid var(--accent)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", color: "var(--accent)", marginBottom: "8px", letterSpacing: "0.05em" }}>
                Join as a Service Provider
              </div>
              <h4 style={{ fontSize: "19px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "10px", lineHeight: 1.25 }}>
                Are you a skilled local worker or volunteer?
              </h4>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: "20px" }}>
                Register your skills, get discovered by homeowners in your village/district, and receive direct job requests with zero commissions.
              </p>
            </div>

            <Link
              href="/provider/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "13px 20px",
                borderRadius: "0px",
                backgroundColor: "var(--accent)",
                color: "var(--accent-text)",
                fontSize: "14px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 12px var(--accent-glow)",
              }}
            >
              <span>Register as a Worker</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* ── Bottom Strip: Copyright & Platform Notice ─────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border)",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          <div>
            © {new Date().getFullYear()} <strong>Smart Urban Services</strong>. All rights reserved.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span>Sri Lanka National Community Service Network</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <Link
              href="/admin/login"
              style={{
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 600,
                opacity: 0.6,
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
            >
              Staff Console
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
