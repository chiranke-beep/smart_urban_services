"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import "./SterlingGateNav.css";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function SterlingGateNav() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isMenuOpenRef = useRef(false);
  const openTl = useRef<gsap.core.Timeline | null>(null);
  const closeTl = useRef<gsap.core.Timeline | null>(null);
  const isFirstRender = useRef(true);
  const { theme, toggleTheme } = useTheme();

  // ─── Scroll listener for smooth navbar line disappearance ──────────
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Build timelines & hover effects ONCE on mount ──────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // ── Shape hover effects for nav links ─────────────
      const menuItems = containerRef.current!.querySelectorAll(".menu-list-item[data-shape]");
      const shapesContainer = containerRef.current!.querySelector(".ambient-background-shapes");

      menuItems.forEach((item) => {
        const shapeIndex = item.getAttribute("data-shape");
        const shape = shapesContainer?.querySelector(`.bg-shape-${shapeIndex}`);
        if (!shape) return;
        const shapeEls = shape.querySelectorAll(".shape-element");

        const onEnter = () => {
          shapesContainer?.querySelectorAll(".bg-shape").forEach((s) => s.classList.remove("active"));
          shape.classList.add("active");
          gsap.fromTo(shapeEls,
            { scale: 0.45, opacity: 0, rotation: -18 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.05, ease: "back.out(2.2)", overwrite: "auto" }
          );
        };
        const onLeave = () => {
          gsap.to(shapeEls, { scale: 0.6, opacity: 0, duration: 0.25, ease: "power2.in", onComplete: () => shape.classList.remove("active"), overwrite: "auto" });
        };

        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("mouseleave", onLeave);
        (item as any)._cleanup = () => {
          item.removeEventListener("mouseenter", onEnter);
          item.removeEventListener("mouseleave", onLeave);
        };
      });

      // ── Menu button + icon hover spin ─────────────────
      const menuBtn = containerRef.current!.querySelector(".nav-close-btn");
      const btnIcon = menuBtn?.querySelector(".menu-button-icon");

      const onBtnEnter = () => {
        if (!isMenuOpenRef.current) {
          gsap.to(btnIcon, { rotate: 90, duration: 0.4, ease: "power3.out", overwrite: "auto" });
        }
      };
      const onBtnLeave = () => {
        if (!isMenuOpenRef.current) {
          gsap.to(btnIcon, { rotate: 0, duration: 0.35, ease: "power3.out", overwrite: "auto" });
        }
      };
      menuBtn?.addEventListener("mouseenter", onBtnEnter);
      menuBtn?.addEventListener("mouseleave", onBtnLeave);

      // ── Get all animated elements ─────────────────────
      const navWrap       = containerRef.current!.querySelector(".nav-overlay-wrapper");
      const overlay       = containerRef.current!.querySelector(".overlay");
      const bgPanels      = containerRef.current!.querySelectorAll(".backdrop-layer");
      const menuLinks     = containerRef.current!.querySelectorAll(".nav-link");
      const btnTexts      = containerRef.current!.querySelectorAll(".nav-close-btn p");
      const menuBtnIcon   = containerRef.current!.querySelector(".menu-button-icon");

      // ── OPEN timeline (paused, called on open) ────────
      openTl.current = gsap.timeline({ paused: true })
        .set(navWrap, { display: "block" })
        .to(btnTexts,    { yPercent: -100, duration: 0.45, ease: "power3.inOut" }, 0)
        .to(menuBtnIcon, { rotate: 315,   duration: 0.50, ease: "power3.inOut" }, 0)
        .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.50, ease: "power2.out" }, 0)
        .fromTo(bgPanels,
          { xPercent: 102 },
          { xPercent: 0, stagger: 0.10, duration: 0.65, ease: "power4.out" }, 0.05)
        .fromTo(menuLinks,
          { yPercent: 150, rotate: 8, opacity: 0 },
          { yPercent: 0, rotate: 0, opacity: 1, stagger: 0.06, duration: 0.70, ease: "power4.out" }, 0.28);

      // ── CLOSE timeline (paused, called on close) ──────
      closeTl.current = gsap.timeline({
        paused: true,
        onComplete: () => gsap.set(navWrap, { display: "none" }),
      })
        .to(menuLinks,   { yPercent: 120, opacity: 0, stagger: 0.03, duration: 0.30, ease: "power3.in" }, 0)
        .to(btnTexts,    { yPercent: 0,  duration: 0.40, ease: "power3.inOut" }, 0)
        .to(menuBtnIcon, { rotate: 0,    duration: 0.40, ease: "power3.inOut" }, 0)
        .to(bgPanels,    { xPercent: 102, stagger: 0.06, duration: 0.45, ease: "power3.in" }, 0.10)
        .to(overlay,     { autoAlpha: 0, duration: 0.35, ease: "power2.in" }, 0.15);

    }, containerRef);

    return () => {
      ctx.revert();
      containerRef.current?.querySelectorAll(".menu-list-item[data-shape]")
        .forEach((item: any) => item._cleanup?.());
    };
  }, []);

  // ─── Trigger open / close when state changes ─────────────────────────
  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (isMenuOpen) {
      closeTl.current?.pause();
      openTl.current?.restart();
    } else {
      openTl.current?.pause();
      closeTl.current?.restart();
    }
  }, [isMenuOpen]);

  // ─── Escape key ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape" && isMenuOpen) setIsMenuOpen(false); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu  = () => setIsMenuOpen(false);

  // ─── Button style logic ─────────────────────────────────────────────
  const isDark = theme === "dark";

  // Menu pill — matches current theme (dark mode → dark pill, light mode → light pill)
  const menuBg     = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.08)";
  const menuColor  = isDark ? "#ffffff"                : "#0f172a";
  const menuBorder = isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(15,23,42,0.15)";

  // Toggle icon — no container, just icon color matching nav contrast
  const iconColor  = isDark ? "#ffffff" : "#0f172a";

  return (
    <div ref={containerRef}>
      {/* ── Fixed Header ─────────────────────────────────── */}
      <div className="site-header-wrapper">
        <header className="header">
          <div className="container is--full">
            <nav className="nav-row">

              {/* Brand — text only, no icon */}
              <Link href="/" aria-label="Smart Urban Services" className="nav-logo-row">
                <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", userSelect: "none" }}>
                  Smart Urban<span style={{ color: "var(--accent)" }}>.</span>
                </span>
              </Link>

              {/* Right controls */}
              <div className="nav-row__right">

                {/* Theme toggle — bare icon, no pill/circle container */}
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    padding: "4px",
                    cursor: "pointer",
                    color: iconColor,
                    transition: "color 0.3s ease, transform 0.2s ease",
                    pointerEvents: "auto",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2) rotate(15deg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) rotate(0deg)")}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Menu + button — pill shape, matches current theme */}
                <button
                  role="button"
                  className="nav-close-btn"
                  onClick={toggleMenu}
                  style={{
                    pointerEvents: "auto",
                    background: menuBg,
                    color: menuColor,
                    border: menuBorder,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <div className="menu-button-text">
                    <p className="p-large">Menu</p>
                    <p className="p-large">Close</p>
                  </div>
                  <div className="icon-wrap">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 16 16" fill="none" className="menu-button-icon">
                      <path d="M7.33333 16L7.33333 -3.2055e-07L8.66667 -3.78832e-07L8.66667 16L7.33333 16Z" fill="currentColor"/>
                      <path d="M16 8.66667L-2.62269e-07 8.66667L-3.78832e-07 7.33333L16 7.33333L16 8.66667Z" fill="currentColor"/>
                      <path d="M6 7.33333L7.33333 7.33333L7.33333 6C7.33333 6.73637 6.73638 7.33333 6 7.33333Z" fill="currentColor"/>
                      <path d="M10 7.33333L8.66667 7.33333L8.66667 6C8.66667 6.73638 9.26362 7.33333 10 7.33333Z" fill="currentColor"/>
                      <path d="M6 8.66667L7.33333 8.66667L7.33333 10C7.33333 9.26362 6.73638 8.66667 6 8.66667Z" fill="currentColor"/>
                      <path d="M10 8.66667L8.66667 8.66667L8.66667 10C8.66667 9.26362 9.26362 8.66667 10 8.66667Z" fill="currentColor"/>
                    </svg>
                  </div>
                </button>

              </div>
            </nav>
          </div>
        </header>
        {/* Animated smooth bottom underline — disappears on scroll */}
        <div className={`nav-bottom-line ${isScrolled ? "is-scrolled" : ""}`} />
      </div>

      {/* ── Kinetic Fullscreen Menu ───────────────────────── */}
      <section className="fullscreen-menu-container">
        <div data-nav="closed" className="nav-overlay-wrapper">
          <div className="overlay" onClick={closeMenu}></div>
          <nav className="menu-content">
            <div className="menu-bg">
              <div className="backdrop-layer first"></div>
              <div className="backdrop-layer second"></div>
              <div className="backdrop-layer"></div>

              <div className="ambient-background-shapes">
                {/* Shape 1 — Citizen / Hazard */}
                <svg className="bg-shape bg-shape-1" viewBox="0 0 400 400" fill="none">
                  <path className="shape-element" d="M200 60 L340 300 L60 300 Z" stroke="rgba(239,68,68,0.45)" strokeWidth="12" strokeLinejoin="round" fill="rgba(239,68,68,0.1)"/>
                  <line className="shape-element" x1="200" y1="140" x2="200" y2="220" stroke="rgba(239,68,68,0.7)" strokeWidth="12" strokeLinecap="round"/>
                  <circle className="shape-element" cx="200" cy="260" r="8" fill="rgba(239,68,68,0.7)"/>
                  <circle className="shape-element" cx="200" cy="200" r="140" stroke="rgba(66,214,255,0.3)" strokeWidth="4" strokeDasharray="16 8"/>
                </svg>
                {/* Shape 2 — Radar / Map */}
                <svg className="bg-shape bg-shape-2" viewBox="0 0 400 400" fill="none">
                  <circle className="shape-element" cx="200" cy="200" r="60"  stroke="rgba(66,214,255,0.6)" strokeWidth="3"/>
                  <circle className="shape-element" cx="200" cy="200" r="110" stroke="rgba(66,214,255,0.4)" strokeWidth="3" strokeDasharray="12 6"/>
                  <circle className="shape-element" cx="200" cy="200" r="160" stroke="rgba(66,214,255,0.25)" strokeWidth="2"/>
                  <line   className="shape-element" x1="200" y1="200" x2="340" y2="90" stroke="rgba(66,214,255,0.7)" strokeWidth="4" strokeLinecap="round"/>
                  <path   className="shape-element" d="M200 110 C175 110,155 130,155 155 C155 190,200 240,200 240 C200 240,245 190,245 155 C245 130,225 110,200 110 Z" fill="rgba(66,214,255,0.45)" stroke="rgba(255,255,255,0.9)" strokeWidth="4"/>
                  <circle className="shape-element" cx="200" cy="155" r="15" fill="#ffffff"/>
                </svg>
                {/* Shape 3 — Service Provider / Wrench */}
                <svg className="bg-shape bg-shape-3" viewBox="0 0 400 400" fill="none">
                  <circle className="shape-element" cx="200" cy="190" r="90" stroke="rgba(244,191,79,0.5)" strokeWidth="10" strokeDasharray="30 15"/>
                  <path   className="shape-element" d="M160 150 L240 230 M240 150 L160 230" stroke="rgba(244,191,79,0.8)" strokeWidth="12" strokeLinecap="round"/>
                  <path   className="shape-element" d="M150 310 L185 345 L255 275" stroke="rgba(52,200,123,0.9)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {/* Shape 4 — Admin Dashboard */}
                <svg className="bg-shape bg-shape-4" viewBox="0 0 400 400" fill="none">
                  <rect className="shape-element" x="90"  y="100" width="220" height="180" rx="16" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.6)" strokeWidth="6"/>
                  <rect className="shape-element" x="120" y="210" width="24" height="50"  rx="4" fill="rgba(168,85,247,0.8)"/>
                  <rect className="shape-element" x="160" y="170" width="24" height="90"  rx="4" fill="rgba(66,214,255,0.8)"/>
                  <rect className="shape-element" x="200" y="140" width="24" height="120" rx="4" fill="rgba(52,200,123,0.8)"/>
                  <rect className="shape-element" x="240" y="190" width="24" height="70"  rx="4" fill="rgba(244,191,79,0.8)"/>
                </svg>
                {/* Shape 5 — Platform Crest */}
                <svg className="bg-shape bg-shape-5" viewBox="0 0 400 400" fill="none">
                  <path className="shape-element" d="M80 150 L200 90 L320 150 Z" fill="rgba(66,214,255,0.3)" stroke="rgba(66,214,255,0.7)" strokeWidth="6"/>
                  <rect className="shape-element" x="80"  y="150" width="240" height="20" fill="rgba(66,214,255,0.45)"/>
                  <rect className="shape-element" x="100" y="170" width="22"  height="110" fill="rgba(66,214,255,0.35)"/>
                  <rect className="shape-element" x="155" y="170" width="22"  height="110" fill="rgba(66,214,255,0.35)"/>
                  <rect className="shape-element" x="223" y="170" width="22"  height="110" fill="rgba(66,214,255,0.35)"/>
                  <rect className="shape-element" x="278" y="170" width="22"  height="110" fill="rgba(66,214,255,0.35)"/>
                  <rect className="shape-element" x="50"  y="296" width="300" height="20" fill="rgba(66,214,255,0.65)"/>
                </svg>
              </div>
            </div>

            <div className="menu-content-wrapper">
              <ul className="menu-list">
                {[
                  { shape: "1", href: "#report",           label: "Citizen Reporting"  },
                  { shape: "2", href: "#map",              label: "Incident Radar Map" },
                  { shape: "3", href: "/provider/portal",  label: "Service Providers"  },
                  { shape: "4", href: "/admin/dashboard",  label: "Admin Dashboard"    },
                  { shape: "5", href: "#about",            label: "System Overview"    },
                ].map(({ shape, href, label }) => (
                  <li key={shape} className="menu-list-item" data-shape={shape} onClick={closeMenu}>
                    <Link href={href} className="nav-link w-inline-block">
                      <p className="nav-link-text">{label}</p>
                      <div className="nav-link-hover-bg"></div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </section>
    </div>
  );
}
