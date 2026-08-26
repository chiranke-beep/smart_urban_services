"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface AuthBackgroundProps {
  variant?: "citizen" | "provider" | "admin";
}

interface ParticleNode {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  angle: number;
  angleSpeed: number;
  floatRadius: number;
}

export function AuthBackground({ variant = "citizen" }: AuthBackgroundProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 160,
    };

    // Calculate Central Form Card Exclusion Zone (with padding buffer)
    const getCardBounds = () => {
      const cardMaxW = variant === "provider" ? 720 : 540;
      const cardW = Math.min(width * 0.92, cardMaxW);
      const cardH = Math.min(height * 0.88, 760);
      const pad = 15;

      return {
        left: (width - cardW) / 2 - pad,
        right: (width + cardW) / 2 + pad,
        top: (height - cardH) / 2 - pad,
        bottom: (height + cardH) / 2 + pad,
      };
    };

    let cardBounds = getCardBounds();

    const isInsideCard = (x: number, y: number) => {
      return (
        x >= cardBounds.left &&
        x <= cardBounds.right &&
        y >= cardBounds.top &&
        y <= cardBounds.bottom
      );
    };

    // Color theme configuration
    const primaryColor =
      variant === "admin"
        ? isDark
          ? "rgba(239, 68, 68, "
          : "rgba(220, 38, 38, "
        : variant === "provider"
          ? isDark
            ? "rgba(249, 115, 22, "
            : "rgba(234, 88, 12, "
          : isDark
            ? "rgba(66, 214, 255, "
            : "rgba(8, 145, 178, ";

    const secondaryColor =
      variant === "admin"
        ? "rgba(185, 28, 28, "
        : variant === "provider"
          ? "rgba(234, 179, 8, "
          : "rgba(139, 92, 246, ";

    // Generate responsive particles strictly in the outer background perimeter
    const particleCount = Math.floor((width * height) / 16000);
    const particles: ParticleNode[] = [];

    const spawnOuterPosition = () => {
      let x = 0;
      let y = 0;
      let attempts = 0;

      // Pick a spot outside the card
      do {
        // Randomly pick left, right, top, or bottom margin
        const side = Math.random();
        if (side < 0.4) {
          // Left margin
          x = Math.random() * Math.max(20, cardBounds.left);
          y = Math.random() * height;
        } else if (side < 0.8) {
          // Right margin
          x = cardBounds.right + Math.random() * Math.max(20, width - cardBounds.right);
          y = Math.random() * height;
        } else if (side < 0.9) {
          // Top margin
          x = Math.random() * width;
          y = Math.random() * Math.max(20, cardBounds.top);
        } else {
          // Bottom margin
          x = Math.random() * width;
          y = cardBounds.bottom + Math.random() * Math.max(20, height - cardBounds.bottom);
        }
        attempts++;
      } while (isInsideCard(x, y) && attempts < 10);

      return { x, y };
    };

    for (let i = 0; i < particleCount; i++) {
      const pos = spawnOuterPosition();
      const isAltColor = Math.random() > 0.65;

      particles.push({
        x: pos.x,
        y: pos.y,
        originX: pos.x,
        originY: pos.y,
        vx: 0,
        vy: 0,
        radius: Math.random() * 2.2 + 1.2,
        color: isAltColor ? secondaryColor : primaryColor,
        alpha: Math.random() * 0.5 + 0.35,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: (Math.random() - 0.5) * 0.015,
        floatRadius: Math.random() * 20 + 8,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cardBounds = getCardBounds();
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      // If mouse is inside the form card, disable magnetic attraction so typing is undisturbed
      if (isInsideCard(e.clientX, e.clientY)) {
        mouse.x = -1000;
        mouse.y = -1000;
      } else {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const springFactor = 0.04;
    const friction = 0.86;
    const repulsionStrength = 16;
    const connectDistance = 110;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // ── 1. Apply Outer Perimeter Canvas Clipping Mask ──
      // This strictly clips out the central form card so no particles/lines can render within it
      ctx.save();
      ctx.beginPath();
      // Outer full window rect
      ctx.rect(0, 0, width, height);
      // Inner card exclusion hole
      ctx.rect(
        cardBounds.left,
        cardBounds.top,
        cardBounds.right - cardBounds.left,
        cardBounds.bottom - cardBounds.top
      );
      // Clip using evenodd rule: inside card is cut out completely
      ctx.clip("evenodd");

      // ── 2. Update Physics & Spring Dampening for Outer Nodes ──
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Ambient gentle floating around origin
        p.angle += p.angleSpeed;
        const targetOriginX = p.originX + Math.cos(p.angle) * p.floatRadius;
        const targetOriginY = p.originY + Math.sin(p.angle) * p.floatRadius;

        // Vector to mouse cursor (outside card only)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);

        // Magnetic repulsion & deflection
        if (dist < mouse.radius && dist > 0) {
          const force = (mouse.radius - dist) / mouse.radius;
          const pushX = (dx / dist) * force * repulsionStrength;
          const pushY = (dy / dist) * force * repulsionStrength;
          p.vx += pushX;
          p.vy += pushY;
        }

        // Deflect away from card edges if pushed toward the center
        if (p.x > cardBounds.left - 20 && p.x < cardBounds.right + 20 && p.y > cardBounds.top - 20 && p.y < cardBounds.bottom + 20) {
          if (p.x < (cardBounds.left + cardBounds.right) / 2) {
            p.vx -= 1.2;
          } else {
            p.vx += 1.2;
          }
        }

        // Hooke's Law: Spring return to home anchor
        const springX = (targetOriginX - p.x) * springFactor;
        const springY = (targetOriginY - p.y) * springFactor;
        p.vx += springX;
        p.vy += springY;

        // Dampening friction
        p.vx *= friction;
        p.vy *= friction;

        p.x += p.vx;
        p.y += p.vy;
      }

      // ── 3. Draw Constellation Network Lines (Outside Card Only) ──
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < connectDistance) {
            const lineOpacity = (1 - dist / connectDistance) * (isDark ? 0.24 : 0.2);
            ctx.strokeStyle = `${primaryColor}${lineOpacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw magnetic connection lines to cursor when mouse is in outer margins
        if (mouse.x > 0) {
          const distToMouse = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
          if (distToMouse < mouse.radius) {
            const mouseLineOpacity = (1 - distToMouse / mouse.radius) * (isDark ? 0.45 : 0.35);
            ctx.strokeStyle = `${primaryColor}${mouseLineOpacity})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      // ── 4. Draw Floating Particle Nodes with Glow ──
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const distToMouse = mouse.x > 0 ? Math.hypot(p.x - mouse.x, p.y - mouse.y) : 999;
        const isHovered = distToMouse < mouse.radius;

        ctx.save();
        ctx.fillStyle = `${p.color}${isHovered ? 1 : p.alpha})`;

        if (isHovered) {
          ctx.shadowColor = `${p.color}1)`;
          ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, isHovered ? p.radius * 1.4 : p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore(); // Restore clipping context

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [variant, isDark]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* ── Magnetic Canvas Layer (Perimeter Only) ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* ── Subtle Geometric Blueprint Grid Overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: isDark
            ? `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)`
            : `radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)`,
          backgroundSize: "36px 36px",
          opacity: 0.7,
        }}
      />
    </div>
  );
}
