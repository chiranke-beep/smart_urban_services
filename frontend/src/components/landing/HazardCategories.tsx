"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  Paintbrush,
  Trees,
  Wrench,
  Sparkles,
  Laptop,
  ArrowRight,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  MessageSquare,
  PhoneCall,
  Hammer,
  Zap,
  Plus,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface ServiceItem {
  id: string;
  num: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  providersAvailable: string;
  avgRating: string;
  reviewCount: number;
  rateRange: string;
  color: string;
  accentGlow: string;
  icon: React.ElementType;
  subtypes: string[];
  sampleLocation: string;
}

const SERVICE_CATEGORIES: ServiceItem[] = [
  {
    id: "painting",
    num: "01",
    title: "Home Painting & Wall Finishing",
    shortTitle: "Painting & Decor",
    tagline: "Interior, exterior wall painting, waterproofing & roof coatings.",
    description:
      "Connect with skilled village painters and color-wash specialists with verified past work photos, quality paint recommendations, and transparent sq.ft quotes.",
    providersAvailable: "142 Active Painters",
    avgRating: "4.9",
    reviewCount: 320,
    rateRange: "Rs. 2,800 – 4,500 / day",
    color: "#f97316",
    accentGlow: "rgba(249, 115, 22, 0.25)",
    icon: Paintbrush,
    subtypes: ["Interior Wall Painting", "Exterior Weathercoat", "Roof Waterproofing", "Wood Polish & Varnish"],
    sampleLocation: "Maharagama, Gampaha & Negombo",
  },
  {
    id: "tree-cutting",
    num: "02",
    title: "Tree Cutting & Yard Clearing",
    shortTitle: "Tree & Yard Care",
    tagline: "Hazardous branch trimming, coconut plucking & compound cleanup.",
    description:
      "Hire experienced local climbers and yard maintenance workers equipped with chain-saws and safety gear to remove high branches before monsoon storms.",
    providersAvailable: "88 Active Tree Cutters",
    avgRating: "4.8",
    reviewCount: 215,
    rateRange: "Rs. 2,500 – 5,000 / job",
    color: "#10b981",
    accentGlow: "rgba(16, 185, 129, 0.25)",
    icon: Trees,
    subtypes: ["Overgrown Tree Trimming", "Coconut Plucking", "Storm Hazard Removal", "Jungle / Grass Clearing"],
    sampleLocation: "Homagama, Piliyandala & Kandy",
  },
  {
    id: "plumbing",
    num: "03",
    title: "Plumbing & Bathroom Repair",
    shortTitle: "Plumbing & Pipes",
    tagline: "Leaking pipe fixes, bathroom tile leaks, water pumps & drainage.",
    description:
      "Fast response local plumbers for urgent leaks, broken bathroom fixtures, submersible pump troubleshooting, and overhead tank cleaning.",
    providersAvailable: "116 Active Plumbers",
    avgRating: "4.9",
    reviewCount: 410,
    rateRange: "Rs. 1,500 – 3,500 / callout",
    color: "#06b6d4",
    accentGlow: "rgba(6, 182, 212, 0.25)",
    icon: Wrench,
    subtypes: ["Burst Pipe Emergency", "Bathroom Fixtures", "Water Pump Repair", "Gutter & Drain Unclogging"],
    sampleLocation: "Dehiwala, Moratuwa & Kelaniya",
  },
  {
    id: "cleaning",
    num: "04",
    title: "House, Roof & Deep Cleaning",
    shortTitle: "House & Roof Clean",
    tagline: "Roof moss clearing, ceiling cleaning, post-construction cleanup.",
    description:
      "Reliable neighborhood cleaners and volunteer groups with high-pressure washers to restore roofs, gutters, solar panels, and full house interiors.",
    providersAvailable: "95 Active Cleaners",
    avgRating: "4.7",
    reviewCount: 180,
    rateRange: "Rs. 3,000 – 6,000 / team",
    color: "#3b82f6",
    accentGlow: "rgba(59, 130, 246, 0.25)",
    icon: Sparkles,
    subtypes: ["Roof Moss & Gutter Wash", "Deep Floor Scrubbing", "Water Tank Disinfection", "Post-Construction Clean"],
    sampleLocation: "Kiribathgoda, Kadawatha & Panadura",
  },
  {
    id: "tech-repair",
    num: "05",
    title: "PC, Laptop & Hardware/Software Techs",
    shortTitle: "PC & Tech Repair",
    tagline: "Hardware troubleshooting, OS reinstallation, virus removal & upgrades.",
    description:
      "Find skilled neighborhood computer technicians for on-site laptop repair, desktop building, SSD/RAM upgrades, software debugging, and home WiFi setups.",
    providersAvailable: "74 Local Tech Experts",
    avgRating: "4.9",
    reviewCount: 290,
    rateRange: "Rs. 1,500 – 4,000 / fix",
    color: "#8b5cf6",
    accentGlow: "rgba(139, 92, 246, 0.25)",
    icon: Laptop,
    subtypes: ["No Power / Blue Screen Fix", "Windows / Mac Reinstall", "SSD / RAM Upgrade", "Virus Removal & Backup"],
    sampleLocation: "Nugegoda, Colombo & Kurunegala",
  },
  {
    id: "custom-odd-jobs",
    num: "06",
    title: "Electrical, Masonry & Custom Odd Jobs",
    shortTitle: "Electrical & Odd Jobs",
    tagline: "Wiring, masonry, gate welding, appliance repair & any custom household job.",
    description:
      "Have a unique household task not listed? From ceiling fan installation, masonry plastering, gate welding to furniture moving, post your custom task and let multi-skilled local handymen respond.",
    providersAvailable: "128 Multi-Skilled Handymen",
    avgRating: "4.8",
    reviewCount: 340,
    rateRange: "Rs. 1,500 – 5,000 / custom",
    color: "#eab308",
    accentGlow: "rgba(234, 179, 8, 0.25)",
    icon: Hammer,
    subtypes: ["Electrical Wiring & Fans", "Masonry & Plastering", "Welding & Gate Fix", "Appliance & Motor Repair", "Moving & Heavy Lifting", "Post Custom Task"],
    sampleLocation: "Island-wide · All Districts",
  },
];

export function HazardCategories() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const activeCategory = SERVICE_CATEGORIES[activeIndex];

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".service-header-anim",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );
      gsap.fromTo(
        ".service-deck-card",
        { opacity: 0, y: 40, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.08, ease: "power4.out", delay: 0.2 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCardHover = (index: number) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveIndex(index);
    }, 60);
  };

  const handleCardLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  // Silky GSAP animation on active card change
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".card-reveal-anim",
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: "power3.out", stagger: 0.05 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [activeIndex]);

  return (
    <section
      ref={containerRef}
      id="services"
      style={{
        position: "relative",
        width: "100%",
        padding: "90px 48px 120px",
        backgroundColor: "var(--bg)",
        transition: "background-color 0.4s ease",
        overflow: "hidden",
      }}
    >
      {/* Ambient background reactive glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "400px",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${activeCategory.accentGlow} 0%, transparent 70%)`,
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
          transition: "background 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, width: "100%", margin: "0 auto" }}>
        {/* Section Header */}
        <div style={{ maxWidth: "760px", marginBottom: "48px" }}>
          <div
            className="service-header-anim"
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
            <Users size={14} />
            <span>Community Service & Volunteer Network</span>
          </div>

          <h2
            className="service-header-anim"
            style={{
              fontSize: "clamp(2rem, 3.8vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Find Trusted Local Workers & Technicians.
          </h2>

          <p
            className="service-header-anim"
            style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
            }}
          >
            No need to search for lost phone numbers. Chat directly with verified workers on the website,
            share job photos and requirements, discuss pricing in real-time, or connect via call & WhatsApp.
          </p>
        </div>

        {/* ── Horizontal Accordion Deck ────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            height: "560px",
            width: "100%",
            borderRadius: "0px",
          }}
          className="service-accordion-container"
        >
          {SERVICE_CATEGORIES.map((item, index) => {
            const isExpanded = activeIndex === index;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="service-deck-card"
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => handleCardHover(index)}
                onMouseLeave={handleCardLeave}
                style={{
                  position: "relative",
                  flex: isExpanded ? 3.6 : 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: isExpanded ? "36px" : "28px 18px",
                  borderRadius: "0px",
                  backgroundColor: isExpanded
                    ? isDark
                      ? "rgba(18, 24, 38, 0.85)"
                      : "rgba(255, 255, 255, 0.95)"
                    : isDark
                    ? "rgba(15, 20, 30, 0.45)"
                    : "rgba(240, 244, 248, 0.65)",
                  border: isExpanded
                    ? `1.5px solid ${item.color}`
                    : "1px solid var(--border)",
                  boxShadow: isExpanded
                    ? `0 24px 48px -15px ${item.accentGlow}, 0 0 0 1px ${item.color}22`
                    : "none",
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "flex 0.9s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.75s cubic-bezier(0.16, 1, 0.3, 1)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  WebkitBackfaceVisibility: "hidden",
                  backfaceVisibility: "hidden",
                  transform: "translateZ(0)",
                }}
              >
                {/* Background accent ambient corner bloom */}
                {isExpanded && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "260px",
                      height: "260px",
                      background: `radial-gradient(circle at top right, ${item.accentGlow} 0%, transparent 70%)`,
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  />
                )}

                {/* ── CARD TOP ────────────────────────────────────────── */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Top Bar: Number + Icon */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isExpanded ? "space-between" : "center",
                      marginBottom: isExpanded ? "28px" : "24px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "0px",
                        backgroundColor: isExpanded
                          ? `${item.color}18`
                          : isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.05)",
                        border: `1px solid ${isExpanded ? item.color : "var(--border)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isExpanded ? item.color : "var(--text-secondary)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <Icon size={22} />
                    </div>

                    {isExpanded && (
                      <div className="card-reveal-anim" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#eab308",
                            backgroundColor: "rgba(234, 179, 8, 0.12)",
                            padding: "4px 10px",
                            borderRadius: "0px",
                          }}
                        >
                          <Star size={13} fill="#eab308" />
                          <span>{item.avgRating} ({item.reviewCount}+ reviews)</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  {isExpanded ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <h3
                        className="card-reveal-anim"
                        style={{
                          fontSize: "26px",
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          color: "var(--text-primary)",
                          lineHeight: 1.2,
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="card-reveal-anim"
                        style={{
                          fontSize: "15px",
                          lineHeight: 1.6,
                          color: "var(--text-secondary)",
                          maxWidth: "520px",
                        }}
                      >
                        {item.description}
                      </p>

                      {/* Sub-hazard / Specialty Tags */}
                      <div
                        className="card-reveal-anim"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginTop: "12px",
                        }}
                      >
                        {item.subtypes.map((sub) => (
                          <span
                            key={sub}
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              padding: "5px 12px",
                              borderRadius: "0px",
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(15,23,42,0.05)",
                              border: "1px solid var(--border)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Collapsed State: Vertical Text */
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                        marginTop: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--text-secondary)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {item.num}
                      </span>
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.shortTitle}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── CARD BOTTOM ─────────────────────────────────────── */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  {isExpanded ? (
                    <div
                      className="card-reveal-anim"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                        paddingTop: "20px",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      {/* Metric Row */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "16px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "11.5px",
                              color: "var(--text-secondary)",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              marginBottom: "4px",
                            }}
                          >
                            <Users size={13} color={item.color} />
                            <span>Available Workers</span>
                          </div>
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "var(--text-primary)",
                              lineHeight: 1.3,
                            }}
                          >
                            {item.providersAvailable}
                          </p>
                        </div>

                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "11.5px",
                              color: "var(--text-secondary)",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              marginBottom: "4px",
                            }}
                          >
                            <Clock size={13} color={item.color} />
                            <span>Avg Daily / Job Rate</span>
                          </div>
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "var(--text-primary)",
                            }}
                          >
                            {item.rateRange}
                          </p>
                        </div>

                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "11.5px",
                              color: "var(--text-secondary)",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              marginBottom: "4px",
                            }}
                          >
                            <MapPin size={13} color={item.color} />
                            <span>Top Service Zones</span>
                          </div>
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: item.color,
                            }}
                          >
                            {item.sampleLocation}
                          </p>
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: "6px",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <CheckCircle2 size={15} color={item.color} />
                          <span>Direct In-App Chat · Verified Profiles</span>
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <Link
                            href={`/messages?category=${item.id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "11px 22px",
                              borderRadius: "0px",
                              backgroundColor: item.color,
                              color: "#ffffff",
                              fontSize: "14px",
                              fontWeight: 800,
                              boxShadow: `0 4px 14px ${item.accentGlow}`,
                              transition: "transform 0.2s ease, filter 0.2s ease",
                              textDecoration: "none",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-2px)";
                              e.currentTarget.style.filter = "brightness(1.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.filter = "brightness(1)";
                            }}
                          >
                            <MessageSquare size={15} />
                            <span>Chat & Book {item.shortTitle}</span>
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Collapsed bottom status dot */
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "0px",
                          backgroundColor: item.color,
                          boxShadow: `0 0 8px ${item.color}`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Custom / Miscellaneous Odd Job Request Banner ─────── */}
        <div
          style={{
            marginTop: "32px",
            padding: "20px 24px",
            borderRadius: "0px",
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)",
            border: "1px dashed var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "0px",
                backgroundColor: "rgba(234, 179, 8, 0.15)",
                border: "1px solid #eab308",
                color: "#eab308",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
                Have a unique household task not listed above?
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                From iron gate welding, water motor fixing, ceiling fan installation to heavy furniture moving.
              </div>
            </div>
          </div>

          <Link
            href="/request?category=custom"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "0px",
              backgroundColor: "var(--card-bg)",
              border: "1.5px solid var(--accent)",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontWeight: 800,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent)";
              e.currentTarget.style.color = "#000000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--card-bg)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
          >
            <Plus size={14} />
            <span>Post a Custom Job Request</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  );
}
