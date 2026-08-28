"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  Search,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Send,
  Star,
  CheckCircle,
  Clock,
  MapPin,
  Camera,
  Image as ImageIcon,
  UserCheck,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface Step {
  num: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  points: string[];
  mockupType: "browse" | "chat" | "review";
}

const STEPS: Step[] = [
  {
    num: "01",
    badge: "Step 1 — Discovery",
    title: "Browse Profiles or Post a Job Request",
    tagline: "Find the right worker in your village or town in seconds.",
    description:
      "Select your required service (Painting, Tree Trimming, Plumbing, Roof Cleaning, or PC Tech) and enter your locality. Browse available local workers with verified reviews, past job photos, and rate transparency, or publish a public job request.",
    points: [
      "Filter by locality (e.g., Gampaha, Maharagama, Kandy)",
      "View verified skills, past work photos & community ratings",
      "Option to post a job and receive direct worker applications",
    ],
    mockupType: "browse",
  },
  {
    num: "02",
    badge: "Step 2 — Direct Communication",
    title: "Chat In Real-Time & Agree on Rates",
    tagline: "Direct on-platform messaging with zero middleman fees.",
    description:
      "Open a direct chat with your chosen service provider right on the website. Send photos of the work area, discuss job requirements, negotiate daily or fixed quotes, and set a visit time. Phone call & WhatsApp are available as fallback options.",
    points: [
      "Real-time instant chat directly inside the website",
      "Attach photos of tree branches, leaky pipes, or PC errors",
      "Transparent quote confirmation before work starts",
    ],
    mockupType: "chat",
  },
  {
    num: "03",
    badge: "Step 3 — Completion & Trust",
    title: "Job Done, Verified Review & Community Support",
    tagline: "Build a trusted local network of verified craftsmen.",
    description:
      "The worker completes the service at your property. Mark the job as finished and leave a verified star rating and review. Your feedback directly empowers hardworking village workers to get more clients while helping neighbors hire with confidence.",
    points: [
      "Confirm work completion with a single tap",
      "Leave star ratings & upload finished job photos",
      "Helps skilled local workers build a digital reputation",
    ],
    mockupType: "review",
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".how-header-anim",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );
      gsap.fromTo(
        ".how-step-nav",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out", delay: 0.2 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const current = STEPS[activeStep] || STEPS[0];

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      style={{
        position: "relative",
        width: "100%",
        padding: "clamp(48px, 6vw, 100px) clamp(16px, 4vw, 48px) clamp(60px, 8vw, 120px)",
        backgroundColor: "var(--bg)",
        borderTop: "1px solid var(--border)",
        transition: "background-color 0.4s ease",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", zIndex: 1, width: "100%", margin: "0 auto" }}>

        {/* ── Section Header ────────────────────────────────────── */}
        <div style={{ maxWidth: "780px", marginBottom: "36px" }}>
          <div
            className="how-header-anim"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "0px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card-bg)",
              backdropFilter: "blur(12px)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "16px",
            }}
          >
            <Sparkles size={14} />
            <span>Simple 3-Step Process</span>
          </div>

          <h2
            className="how-header-anim"
            style={{
              fontSize: "clamp(2rem, 3.8vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            How Smart Urban Connects You.
          </h2>

          <p
            className="how-header-anim"
            style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
            }}
          >
            No hidden commissions, no lost phone numbers. Directly discover, chat, hire, and review
            verified local workers across Sri Lanka.
          </p>
        </div>

        {/* ── Step Selector Tabs (Sharp Brutalist) ─────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: "14px",
            marginBottom: "32px",
          }}
        >
          {STEPS.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className="how-step-nav"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "18px 20px",
                  borderRadius: "0px",
                  backgroundColor: isActive
                    ? isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(15,23,42,0.04)"
                    : "transparent",
                  border: isActive
                    ? "1.5px solid var(--accent)"
                    : "1px solid var(--border)",
                  borderBottom: isActive
                    ? "3px solid var(--accent)"
                    : "1px solid var(--border)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {step.num}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: isActive ? "var(--accent)" : "var(--text-secondary)",
                      marginBottom: "4px",
                    }}
                  >
                    {step.badge}
                  </div>
                  <div
                    style={{
                      fontSize: "14.5px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      lineHeight: 1.3,
                    }}
                  >
                    {step.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Interactive Step Content & Live Mockup ───────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            gap: "24px",
            minHeight: "440px",
          }}
        >
          {/* Left: Step Details Box */}
          <div
            style={{
              padding: "clamp(20px, 4vw, 40px)",
              borderRadius: "0px",
              backgroundColor: isDark ? "rgba(18, 24, 38, 0.75)" : "rgba(255, 255, 255, 0.85)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backdropFilter: "blur(16px)",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "0px",
                  backgroundColor: "rgba(66, 214, 255, 0.12)",
                  color: "var(--accent)",
                  fontSize: "13px",
                  fontWeight: 800,
                  marginBottom: "16px",
                }}
              >
                <span>PHASE {current.num}</span>
              </div>

              <h3
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  lineHeight: 1.25,
                  marginBottom: "14px",
                }}
              >
                {current.title}
              </h3>

              <p
                style={{
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                  marginBottom: "24px",
                }}
              >
                {current.description}
              </p>

              {/* Bullet Points */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {current.points.map((pt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <CheckCircle
                      size={18}
                      style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }}
                    />
                    <span style={{ fontSize: "15.5px", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
                      {pt}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                paddingTop: "28px",
                marginTop: "24px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <Link
                href="#services"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "13px 26px",
                  borderRadius: "0px",
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                  fontSize: "14px",
                  fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px var(--accent-glow)",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <span>Get Started Now</span>
                <ArrowRight size={15} />
              </Link>

              <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600 }}>
                Step {activeStep + 1} of 3
              </span>
            </div>
          </div>

          {/* Right: Realistic Dynamic UI Mockup */}
          <div
            style={{
              padding: "32px",
              borderRadius: "0px",
              backgroundColor: isDark ? "rgba(12, 16, 26, 0.9)" : "rgba(245, 248, 252, 0.9)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* ── MOCKUP 1: Browse Profiles ────────────────────── */}
            {current.mockupType === "browse" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Search Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "0px",
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Search size={16} color="var(--accent)" />
                  <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>
                    Tree Cutters & Climbers in Maharagama
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "11px",
                      padding: "2px 8px",
                      backgroundColor: "rgba(16,185,129,0.15)",
                      color: "#10b981",
                      fontWeight: 700,
                    }}
                  >
                    14 Online
                  </span>
                </div>

                {/* Worker Card Preview */}
                <div
                  style={{
                    padding: "18px",
                    borderRadius: "0px",
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                    border: "1.5px solid var(--accent)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "0px",
                          backgroundColor: "#10b981",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "15px",
                        }}
                      >
                        SK
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" }}>
                            Sunil Kumara
                          </span>
                          <UserCheck size={14} color="var(--accent)" />
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          Master Tree Climber & Yard Specialist · 12 yrs exp
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#eab308",
                      }}
                    >
                      <Star size={13} fill="#eab308" />
                      <span>4.9 (142)</span>
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["Coconut Plucking", "Chain-Saw Cut", "Power Line Clearance"].map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                      Rs. 3,500 <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>/ tree job</span>
                    </span>
                    <button
                      style={{
                        padding: "6px 14px",
                        borderRadius: "0px",
                        backgroundColor: "var(--accent)",
                        color: "var(--accent-text)",
                        fontSize: "12px",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Start In-App Chat
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MOCKUP 2: In-App Chat Dialog ────────────────── */}
            {current.mockupType === "chat" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "360px",
                  borderRadius: "0px",
                  border: "1px solid var(--border)",
                  backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                }}
              >
                {/* Chat Header */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "0px",
                        backgroundColor: "#f97316",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 800,
                      }}
                    >
                      KP
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                        Kamal Perera (Painter)
                      </div>
                      <div style={{ fontSize: "10px", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981" }} />
                        <span>Active Online</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Maharagama</span>
                </div>

                {/* Chat Messages Body */}
                <div
                  style={{
                    flex: 1,
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    overflowY: "auto",
                  }}
                >
                  {/* Homeowner Message */}
                  <div
                    style={{
                      alignSelf: "flex-end",
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-text)",
                      padding: "8px 12px",
                      borderRadius: "0px",
                      maxWidth: "75%",
                      fontSize: "12px",
                      lineHeight: 1.4,
                      fontWeight: 500,
                    }}
                  >
                    Hi Kamal, I need exterior wall painting for 2-storey house. Here is a photo of the front wall.
                  </div>

                  {/* Photo Attachment preview */}
                  <div
                    style={{
                      alignSelf: "flex-end",
                      padding: "6px 10px",
                      border: "1px dashed var(--border)",
                      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      color: "var(--text-primary)",
                    }}
                  >
                    <ImageIcon size={14} color="var(--accent)" />
                    <span>front_wall_exterior.jpg (Attached)</span>
                  </div>

                  {/* Worker Reply */}
                  <div
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      color: "var(--text-primary)",
                      padding: "8px 12px",
                      borderRadius: "0px",
                      maxWidth: "75%",
                      fontSize: "12px",
                      lineHeight: 1.4,
                    }}
                  >
                    I checked the photo! I can do 2 coats of weathercoat. Rate is Rs. 3,200/day. Can start tomorrow morning 8 AM?
                  </div>
                </div>

                {/* Chat Input Bar */}
                <div
                  style={{
                    padding: "10px 12px",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <button style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
                    <Camera size={16} />
                  </button>
                  <input
                    type="text"
                    readOnly
                    value="Agreed! Please bring color sample chart..."
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "12px",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-text)",
                      border: "none",
                      borderRadius: "0px",
                      cursor: "pointer",
                    }}
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* ── MOCKUP 3: Verified Review Submission ────────── */}
            {current.mockupType === "review" && (
              <div
                style={{
                  padding: "24px",
                  borderRadius: "0px",
                  border: "1.5px solid #10b981",
                  backgroundColor: isDark ? "rgba(16,185,129,0.04)" : "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#10b981",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
                      Job Marked as Completed!
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      PC Motherboard & Windows Setup · Resolved in 3 hrs
                    </div>
                  </div>
                </div>

                {/* Rating Input Mock */}
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Rate your experience with Technician Dinesh:
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={22} fill="#eab308" color="#eab308" />
                    ))}
                  </div>
                </div>

                {/* Testimonial Snippet */}
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                    lineHeight: 1.5,
                  }}
                >
                  &ldquo;Dinesh arrived within 45 mins in Kelaniya. Fixed the blue-screen hardware crash and reinstalled genuine OS. Very polite and honest pricing!&rdquo;
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>
                    ✓ Badge Earned: Top Rated Technician
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Published to Community Feed
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
