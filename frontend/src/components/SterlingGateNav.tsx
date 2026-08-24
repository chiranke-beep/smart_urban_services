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

    // Per-shape idle tweens so we can kill them on leave
    const idleTweens: Record<string, gsap.core.Tween[]> = {};

    const ctx = gsap.context(() => {
      // ── Shape hover effects for nav links ─────────────
      const menuItems = containerRef.current!.querySelectorAll(".menu-list-item[data-shape]");
      const shapesContainer = containerRef.current!.querySelector(".ambient-background-shapes");

      menuItems.forEach((item) => {
        const shapeIndex = item.getAttribute("data-shape")!;
        const shape = shapesContainer?.querySelector(`.bg-shape-${shapeIndex}`);
        if (!shape) return;
        const els = shape.querySelectorAll(".shape-element");

        const killIdle = () => {
          (idleTweens[shapeIndex] || []).forEach((t) => t.kill());
          idleTweens[shapeIndex] = [];
        };

        const startIdle = () => {
          killIdle();
          // Generic gentle float on the whole shape container
          const floatTween = gsap.to(shape, {
            y: "-=10",
            duration: 2.8,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
          idleTweens[shapeIndex] = [floatTween];

          if (shapeIndex === "1") {
            // Grid tiles: subtle scale breathe on each tile staggered
            const breathe = gsap.to(els, {
              scale: 1.04,
              duration: 1.6,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              stagger: { each: 0.25, from: "random" },
              transformOrigin: "center center",
            });
            idleTweens[shapeIndex].push(breathe);
          }
          if (shapeIndex === "2") {
            // Magnifier: gentle slow rotation
            const mag = shape.querySelectorAll(".shape-element:nth-child(n+3)");
            const spin = gsap.to(mag, {
              rotation: 4,
              transformOrigin: "center center",
              duration: 2.2,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
            idleTweens[shapeIndex].push(spin);
          }
          if (shapeIndex === "3") {
            // Plus badge: pulse scale
            const badge = shape.querySelectorAll(".shape-element:nth-child(n+3)");
            const pulse = gsap.to(badge, {
              scale: 1.1,
              transformOrigin: "center center",
              duration: 1.4,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
            idleTweens[shapeIndex].push(pulse);
          }
          if (shapeIndex === "4") {
            // Shield inner ring: slow pulse
            const ring = Array.from(els).slice(1);
            const glow = gsap.to(ring, {
              scale: 1.06,
              transformOrigin: "center center",
              duration: 2,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
            idleTweens[shapeIndex].push(glow);
          }
          if (shapeIndex === "5") {
            // Steps: each step circle pulses in sequence
            const circles = [
              shape.querySelector(".shape-element:nth-child(1)"),
              shape.querySelector(".shape-element:nth-child(5)"),
              shape.querySelector(".shape-element:nth-child(9)"),
            ].filter(Boolean);
            const cascade = gsap.to(circles, {
              scale: 1.12,
              transformOrigin: "center center",
              duration: 1.0,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              stagger: 0.35,
            });
            idleTweens[shapeIndex].push(cascade);
          }
        };

        const onEnter = () => {
          shapesContainer?.querySelectorAll(".bg-shape").forEach((s) => {
            if (s !== shape) {
              s.classList.remove("active");
              const otherIdx = (s.className.match(/bg-shape-(\d)/) || [])[1];
              if (otherIdx) killIdle();
            }
          });
          shape.classList.add("active");

          // Kill any leftover tweens on these elements
          gsap.killTweensOf(els);
          gsap.killTweensOf(shape);

          if (shapeIndex === "1") {
            // Grid tiles: each tile slides up from below with a card pop
            gsap.fromTo(Array.from(els).slice(0, 4).filter((_, i) => i % 4 === 0),
              { y: 40, opacity: 0, scale: 0.85 },
              { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.12, ease: "back.out(2)", overwrite: "auto" }
            );
            // Text lines fade in after
            gsap.fromTo(Array.from(els).filter((_, i) => i % 4 !== 0),
              { x: -12, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: "power3.out", delay: 0.2, overwrite: "auto" }
            );
          } else if (shapeIndex === "2") {
            // Person: head drops in, body grows up
            const [head, body, magCircle, magHandle, crossH, crossV] = Array.from(els);
            gsap.fromTo(head,
              { y: -30, scale: 0.6, opacity: 0 },
              { y: 0, scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2.5)", overwrite: "auto" }
            );
            gsap.fromTo(body,
              { scaleY: 0, opacity: 0, transformOrigin: "top center" },
              { scaleY: 1, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.18, overwrite: "auto" }
            );
            // Magnifier swings in from right
            gsap.fromTo([magCircle, magHandle, crossH, crossV],
              { x: 30, opacity: 0, scale: 0.7, rotation: -25, transformOrigin: "center center" },
              { x: 0, opacity: 1, scale: 1, rotation: 0, duration: 0.65, stagger: 0.06, ease: "back.out(2.2)", delay: 0.25, overwrite: "auto" }
            );
          } else if (shapeIndex === "3") {
            // Person: slides in from left; plus badge bounces in from right
            const [head, body, badgeCircle, crossH, crossV] = Array.from(els);
            gsap.fromTo([head, body],
              { x: -30, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.55, stagger: 0.1, ease: "power4.out", overwrite: "auto" }
            );
            gsap.fromTo(badgeCircle,
              { scale: 0, opacity: 0, transformOrigin: "center center" },
              { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(3)", delay: 0.3, overwrite: "auto" }
            );
            gsap.fromTo([crossH, crossV],
              { scale: 0, opacity: 0, transformOrigin: "290px 148px" },
              { scale: 1, opacity: 1, duration: 0.45, stagger: 0.08, ease: "back.out(4)", delay: 0.48, overwrite: "auto" }
            );
          } else if (shapeIndex === "4") {
            // Shield draws in, then checkmark strokes on
            const [shieldOuter, shieldInner, checkmark] = Array.from(els);
            gsap.fromTo(shieldOuter,
              { scale: 0.5, opacity: 0, transformOrigin: "200px 208px" },
              { scale: 1, opacity: 1, duration: 0.65, ease: "back.out(2)", overwrite: "auto" }
            );
            gsap.fromTo(shieldInner,
              { scale: 0.6, opacity: 0, transformOrigin: "200px 210px" },
              { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.2, overwrite: "auto" }
            );
            // Checkmark strokes in via dashoffset
            gsap.set(checkmark, { strokeDasharray: 160, strokeDashoffset: 160, opacity: 1 });
            gsap.to(checkmark, {
              strokeDashoffset: 0,
              duration: 0.7,
              ease: "power3.inOut",
              delay: 0.4,
              overwrite: "auto",
            });
          } else if (shapeIndex === "5") {
            // Steps cascade in one-by-one: circle then text bars
            const allEls = Array.from(els);
            // Groups: [circle, label, bar1, bar2, connector] × 3
            const step1 = allEls.slice(0, 4);
            const conn1  = allEls[4];
            const step2 = allEls.slice(5, 9);
            const conn2  = allEls[9];
            const step3 = allEls.slice(10);

            gsap.fromTo(step1,
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "back.out(2)", overwrite: "auto" }
            );
            gsap.fromTo(conn1,
              { scaleY: 0, opacity: 0, transformOrigin: "top center" },
              { scaleY: 1, opacity: 1, duration: 0.3, ease: "power2.out", delay: 0.32, overwrite: "auto" }
            );
            gsap.fromTo(step2,
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "back.out(2)", delay: 0.45, overwrite: "auto" }
            );
            gsap.fromTo(conn2,
              { scaleY: 0, opacity: 0, transformOrigin: "top center" },
              { scaleY: 1, opacity: 1, duration: 0.3, ease: "power2.out", delay: 0.72, overwrite: "auto" }
            );
            gsap.fromTo(step3,
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "back.out(2)", delay: 0.85, overwrite: "auto" }
            );
          }

          // Start idle loops after entrance
          setTimeout(startIdle, shapeIndex === "4" ? 900 : shapeIndex === "5" ? 1200 : 650);
        };

        const onLeave = () => {
          killIdle();
          gsap.to(shape, { y: 0, duration: 0.2, overwrite: "auto" });
          gsap.to(els, {
            scale: 0.75,
            opacity: 0,
            y: -8,
            duration: 0.3,
            ease: "power3.in",
            stagger: { each: 0.025, from: "end" },
            onComplete: () => shape.classList.remove("active"),
            overwrite: "auto",
          });
        };

        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("mouseleave", onLeave);
        (item as any)._cleanup = () => {
          item.removeEventListener("mouseenter", onEnter);
          item.removeEventListener("mouseleave", onLeave);
          killIdle();
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

                {/* Shape 1 — Local Service Directory: grid of service tiles */}
                <svg className="bg-shape bg-shape-1" viewBox="0 0 400 400" fill="none">
                  {/* Grid tile 1 */}
                  <rect className="shape-element" x="80" y="80" width="90" height="90" rx="10" fill="rgba(66,214,255,0.15)" stroke="rgba(66,214,255,0.7)" strokeWidth="5"/>
                  <rect className="shape-element" x="98" y="108" width="54" height="8" rx="3" fill="rgba(66,214,255,0.7)"/>
                  <rect className="shape-element" x="98" y="124" width="38" height="6" rx="3" fill="rgba(66,214,255,0.4)"/>
                  <rect className="shape-element" x="98" y="138" width="46" height="6" rx="3" fill="rgba(66,214,255,0.4)"/>
                  {/* Grid tile 2 */}
                  <rect className="shape-element" x="230" y="80" width="90" height="90" rx="10" fill="rgba(66,214,255,0.15)" stroke="rgba(66,214,255,0.7)" strokeWidth="5"/>
                  <rect className="shape-element" x="248" y="108" width="54" height="8" rx="3" fill="rgba(66,214,255,0.7)"/>
                  <rect className="shape-element" x="248" y="124" width="38" height="6" rx="3" fill="rgba(66,214,255,0.4)"/>
                  <rect className="shape-element" x="248" y="138" width="46" height="6" rx="3" fill="rgba(66,214,255,0.4)"/>
                  {/* Grid tile 3 */}
                  <rect className="shape-element" x="80" y="230" width="90" height="90" rx="10" fill="rgba(66,214,255,0.15)" stroke="rgba(66,214,255,0.7)" strokeWidth="5"/>
                  <rect className="shape-element" x="98" y="258" width="54" height="8" rx="3" fill="rgba(66,214,255,0.7)"/>
                  <rect className="shape-element" x="98" y="274" width="38" height="6" rx="3" fill="rgba(66,214,255,0.4)"/>
                  <rect className="shape-element" x="98" y="288" width="46" height="6" rx="3" fill="rgba(66,214,255,0.4)"/>
                  {/* Grid tile 4 */}
                  <rect className="shape-element" x="230" y="230" width="90" height="90" rx="10" fill="rgba(66,214,255,0.15)" stroke="rgba(66,214,255,0.7)" strokeWidth="5"/>
                  <rect className="shape-element" x="248" y="258" width="54" height="8" rx="3" fill="rgba(66,214,255,0.7)"/>
                  <rect className="shape-element" x="248" y="274" width="38" height="6" rx="3" fill="rgba(66,214,255,0.4)"/>
                  <rect className="shape-element" x="248" y="288" width="46" height="6" rx="3" fill="rgba(66,214,255,0.4)"/>
                </svg>

                {/* Shape 2 — Find Workers & Techs: person silhouette + magnifier */}
                <svg className="bg-shape bg-shape-2" viewBox="0 0 400 400" fill="none">
                  {/* Person head */}
                  <circle className="shape-element" cx="170" cy="140" r="45" fill="rgba(66,214,255,0.2)" stroke="rgba(66,214,255,0.7)" strokeWidth="6"/>
                  {/* Person body */}
                  <path className="shape-element" d="M90 290 C90 240 130 210 170 210 C210 210 250 240 250 290" fill="rgba(66,214,255,0.15)" stroke="rgba(66,214,255,0.7)" strokeWidth="6" strokeLinecap="round"/>
                  {/* Magnifier circle */}
                  <circle className="shape-element" cx="290" cy="260" r="55" stroke="rgba(255,255,255,0.75)" strokeWidth="10" fill="none"/>
                  {/* Magnifier handle */}
                  <line className="shape-element" x1="332" y1="302" x2="370" y2="340" stroke="rgba(255,255,255,0.75)" strokeWidth="14" strokeLinecap="round"/>
                  {/* Search plus detail */}
                  <line className="shape-element" x1="270" y1="260" x2="310" y2="260" stroke="rgba(66,214,255,0.8)" strokeWidth="7" strokeLinecap="round"/>
                  <line className="shape-element" x1="290" y1="240" x2="290" y2="280" stroke="rgba(66,214,255,0.8)" strokeWidth="7" strokeLinecap="round"/>
                </svg>

                {/* Shape 3 — Join as a Worker / Volunteer: person + plus badge */}
                <svg className="bg-shape bg-shape-3" viewBox="0 0 400 400" fill="none">
                  {/* Main person head */}
                  <circle className="shape-element" cx="160" cy="130" r="48" fill="rgba(52,200,123,0.2)" stroke="rgba(52,200,123,0.8)" strokeWidth="6"/>
                  {/* Main person body */}
                  <path className="shape-element" d="M75 310 C75 255 115 220 160 220 C205 220 245 255 245 310" fill="rgba(52,200,123,0.15)" stroke="rgba(52,200,123,0.8)" strokeWidth="6" strokeLinecap="round"/>
                  {/* Plus badge circle */}
                  <circle className="shape-element" cx="298" cy="148" r="52" fill="rgba(66,214,255,0.2)" stroke="rgba(66,214,255,0.8)" strokeWidth="6"/>
                  {/* Plus sign */}
                  <line className="shape-element" x1="274" y1="148" x2="322" y2="148" stroke="rgba(66,214,255,0.95)" strokeWidth="10" strokeLinecap="round"/>
                  <line className="shape-element" x1="298" y1="124" x2="298" y2="172" stroke="rgba(66,214,255,0.95)" strokeWidth="10" strokeLinecap="round"/>
                </svg>

                {/* Shape 4 — Admin & Verification: large shield with checkmark */}
                <svg className="bg-shape bg-shape-4" viewBox="0 0 400 400" fill="none">
                  {/* Shield outer */}
                  <path className="shape-element" d="M200 60 L330 110 L330 220 C330 295 200 355 200 355 C200 355 70 295 70 220 L70 110 Z" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.7)" strokeWidth="8" strokeLinejoin="round"/>
                  {/* Shield inner glow ring */}
                  <path className="shape-element" d="M200 90 L310 132 L310 215 C310 278 200 330 200 330 C200 330 90 278 90 215 L90 132 Z" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="4" strokeLinejoin="round"/>
                  {/* Checkmark */}
                  <path className="shape-element" d="M145 205 L185 248 L262 168" stroke="rgba(52,200,123,0.95)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>

                {/* Shape 5 — How It Works: three numbered steps with arrows */}
                <svg className="bg-shape bg-shape-5" viewBox="0 0 400 400" fill="none">
                  {/* Step 1 */}
                  <circle className="shape-element" cx="90" cy="120" r="36" fill="rgba(66,214,255,0.2)" stroke="rgba(66,214,255,0.75)" strokeWidth="6"/>
                  <text className="shape-element" x="90" y="128" textAnchor="middle" fill="rgba(66,214,255,0.95)" fontSize="26" fontWeight="800">1</text>
                  <rect className="shape-element" x="140" y="108" width="110" height="10" rx="4" fill="rgba(66,214,255,0.55)"/>
                  <rect className="shape-element" x="140" y="126" width="80" height="8" rx="4" fill="rgba(66,214,255,0.3)"/>
                  {/* Arrow 1→2 */}
                  <path className="shape-element" d="M90 162 L90 185" stroke="rgba(66,214,255,0.45)" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4"/>
                  {/* Step 2 */}
                  <circle className="shape-element" cx="90" cy="215" r="36" fill="rgba(244,191,79,0.2)" stroke="rgba(244,191,79,0.75)" strokeWidth="6"/>
                  <text className="shape-element" x="90" y="223" textAnchor="middle" fill="rgba(244,191,79,0.95)" fontSize="26" fontWeight="800">2</text>
                  <rect className="shape-element" x="140" y="203" width="130" height="10" rx="4" fill="rgba(244,191,79,0.55)"/>
                  <rect className="shape-element" x="140" y="221" width="90" height="8" rx="4" fill="rgba(244,191,79,0.3)"/>
                  {/* Arrow 2→3 */}
                  <path className="shape-element" d="M90 257 L90 280" stroke="rgba(52,200,123,0.45)" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4"/>
                  {/* Step 3 */}
                  <circle className="shape-element" cx="90" cy="310" r="36" fill="rgba(52,200,123,0.2)" stroke="rgba(52,200,123,0.75)" strokeWidth="6"/>
                  <text className="shape-element" x="90" y="318" textAnchor="middle" fill="rgba(52,200,123,0.95)" fontSize="26" fontWeight="800">3</text>
                  <rect className="shape-element" x="140" y="298" width="120" height="10" rx="4" fill="rgba(52,200,123,0.55)"/>
                  <rect className="shape-element" x="140" y="316" width="85" height="8" rx="4" fill="rgba(52,200,123,0.3)"/>
                </svg>

              </div>
            </div>

            <div className="menu-content-wrapper">
              <ul className="menu-list">
                {[
                  { shape: "1", href: "#services",          label: "Local Service Directory"     },
                  { shape: "2", href: "#workers",           label: "Find Workers & Techs"        },
                  { shape: "3", href: "/register-provider", label: "Join as a Worker / Volunteer" },
                  { shape: "4", href: "/admin/dashboard",   label: "Admin & Verification"        },
                  { shape: "5", href: "#how-it-works",      label: "How It Works"                },
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
