import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowRight, AlertTriangle, Compass, ShieldCheck } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/api";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const isDark = theme === "dark";
  const [platformStats, setPlatformStats] = useState<{
    totalWorkers?: number;
    totalCitizens?: number;
    totalCompletedJobs?: number;
    totalReviews?: number;
  }>({});

  useEffect(() => {
    apiClient<{ success: boolean; data?: any }>("/analytics/platform-stats")
      .then((res) => {
        if (res?.data) setPlatformStats(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(".hero-badge",  { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, 0.2)
        .fromTo(".hero-line-1", { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.9 }, 0.35)
        .fromTo(".hero-line-2", { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.9 }, 0.5)
        .fromTo(".hero-line-3", { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.9 }, 0.65)
        .fromTo(".hero-bar",    { scaleX: 0 },         { scaleX: 1, duration: 0.6 },          0.8)
        .fromTo(".hero-desc",   { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, 0.9)
        .fromTo(".hero-cta",    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 }, 1.0)
        .fromTo(".hero-stat",   { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, 1.1)
        .fromTo(".city-glow",   { opacity: 0 },        { opacity: 1, duration: 1.5, ease: "power1.inOut" }, 0.4)
        .to(".city-glow",       { opacity: 0.5, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" }, 2);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "calc(100vh - 54px)",
        marginTop: "54px",
        display: "flex",
        alignItems: "center",
        backgroundColor: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {/* ── City Silhouette Background ──────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>

        {/* Ambient sky glow — blue-purple at night, warm orange at day */}
        <div
          className="city-glow"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "70%",
            background: isDark
              ? "linear-gradient(to top, rgba(30,100,255,0.12) 0%, rgba(66,214,255,0.06) 50%, transparent 100%)"
              : "linear-gradient(to top, rgba(255,160,50,0.10) 0%, rgba(255,200,80,0.04) 50%, transparent 100%)",
            transition: "background 0.6s ease",
          }}
        />

        {/* ── Sky: Moon (dark) or Sun (light) ─────────────── */}
        <svg
          style={{ position: "absolute", top: 0, right: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          viewBox="0 0 1200 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {isDark ? (
            /* ── Moon (crescent) ── */
            <g>
              {/* Moon glow halo */}
              <circle cx="1000" cy="130" r="65" fill="rgba(255,255,220,0.04)"/>
              <circle cx="1000" cy="130" r="50" fill="rgba(255,255,220,0.07)"/>
              {/* Crescent shape: full circle minus offset circle */}
              <circle cx="1000" cy="130" r="36" fill="rgba(255,255,210,0.92)"/>
              <circle cx="1018" cy="122" r="29" fill="#090b0e"/>
              {/* Stars */}
              <circle cx="890" cy="88"  r="2"   fill="rgba(255,255,255,0.7)"/>
              <circle cx="930" cy="70"  r="1.5" fill="rgba(255,255,255,0.5)"/>
              <circle cx="1070" cy="95" r="2"   fill="rgba(255,255,255,0.6)"/>
              <circle cx="1120" cy="65" r="1.5" fill="rgba(255,255,255,0.4)"/>
              <circle cx="950" cy="110" r="1"   fill="rgba(255,255,255,0.5)"/>
              <circle cx="1090" cy="170" r="1.5" fill="rgba(255,255,255,0.4)"/>
              <circle cx="840" cy="120" r="1"   fill="rgba(255,255,255,0.35)"/>
              <circle cx="1160" cy="110" r="1"  fill="rgba(255,255,255,0.4)"/>
            </g>
          ) : (
            /* ── Sun ── */
            <g>
              {/* Sun glow layers */}
              <circle cx="1000" cy="130" r="90" fill="rgba(255,200,50,0.06)"/>
              <circle cx="1000" cy="130" r="70" fill="rgba(255,210,60,0.10)"/>
              <circle cx="1000" cy="130" r="50" fill="rgba(255,220,70,0.14)"/>
              {/* Sun body */}
              <circle cx="1000" cy="130" r="34" fill="rgba(255,215,0,0.88)"/>
              {/* Sun rays */}
              <line x1="1000" y1="80" x2="1000" y2="65" stroke="rgba(255,215,0,0.7)" strokeWidth="4" strokeLinecap="round"/>
              <line x1="1000" y1="180" x2="1000" y2="195" stroke="rgba(255,215,0,0.7)" strokeWidth="4" strokeLinecap="round"/>
              <line x1="950" y1="130" x2="935" y2="130" stroke="rgba(255,215,0,0.7)" strokeWidth="4" strokeLinecap="round"/>
              <line x1="1050" y1="130" x2="1065" y2="130" stroke="rgba(255,215,0,0.7)" strokeWidth="4" strokeLinecap="round"/>
              <line x1="965" y1="95" x2="954" y2="84" stroke="rgba(255,215,0,0.6)" strokeWidth="3" strokeLinecap="round"/>
              <line x1="1035" y1="95" x2="1046" y2="84" stroke="rgba(255,215,0,0.6)" strokeWidth="3" strokeLinecap="round"/>
              <line x1="965" y1="165" x2="954" y2="176" stroke="rgba(255,215,0,0.6)" strokeWidth="3" strokeLinecap="round"/>
              <line x1="1035" y1="165" x2="1046" y2="176" stroke="rgba(255,215,0,0.6)" strokeWidth="3" strokeLinecap="round"/>
            </g>
          )}
        </svg>

        {/* ── City Skyline SVG ─────────────────────────────── */}
        <svg
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "58%",
            maxWidth: "900px",
            height: "auto",
            opacity: isDark ? 0.75 : 0.35,
            color: isDark ? "#1a2035" : "#94a3b8",
            transition: "opacity 0.5s ease, color 0.5s ease",
          }}
          viewBox="0 0 1200 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMaxYMax meet"
        >
          {/* Buildings */}
          <rect x="0"   y="260" width="60"  height="260" fill="currentColor"/>
          <rect x="55"  y="200" width="45"  height="320" fill="currentColor"/>
          <rect x="95"  y="240" width="70"  height="280" fill="currentColor"/>
          <rect x="160" y="180" width="50"  height="340" fill="currentColor"/>
          <rect x="205" y="220" width="40"  height="300" fill="currentColor"/>
          <rect x="240" y="160" width="55"  height="360" fill="currentColor"/>
          <rect x="290" y="200" width="45"  height="320" fill="currentColor"/>
          <rect x="330" y="130" width="65"  height="390" fill="currentColor"/>
          <rect x="358" y="80"  width="8"   height="55"  fill="currentColor"/>
          <rect x="390" y="190" width="50"  height="330" fill="currentColor"/>
          <rect x="435" y="210" width="40"  height="310" fill="currentColor"/>
          <rect x="480" y="140" width="80"  height="380" fill="currentColor"/>
          <rect x="555" y="170" width="55"  height="350" fill="currentColor"/>
          <rect x="580" y="100" width="30"  height="75"  fill="currentColor"/>
          <rect x="605" y="155" width="65"  height="365" fill="currentColor"/>
          <rect x="665" y="120" width="90"  height="400" fill="currentColor"/>
          <rect x="750" y="180" width="60"  height="340" fill="currentColor"/>
          <rect x="805" y="150" width="75"  height="370" fill="currentColor"/>
          <rect x="870" y="60"  width="100" height="460" fill="currentColor"/>
          <rect x="895" y="40"  width="12"  height="25"  fill="currentColor"/>
          <rect x="965" y="200" width="55"  height="320" fill="currentColor"/>
          <rect x="1015" y="170" width="70" height="350" fill="currentColor"/>
          <rect x="1080" y="220" width="50" height="300" fill="currentColor"/>
          <rect x="1125" y="240" width="75" height="280" fill="currentColor"/>
          {/* Ground */}
          <rect x="0"   y="516" width="1200" height="8"  fill="currentColor" opacity="0.6"/>

          {/* ── Building Windows ──────────────────────────────
              In dark mode: warm amber/yellow glowing windows
              In light mode: soft blue-gray (daytime) windows        */}
          {isDark ? (
            <>
              {/* Main tower — fully lit */}
              <rect x="882" y="80"  width="12" height="10" rx="1" fill="#FFD700" opacity="0.95"/>
              <rect x="903" y="80"  width="12" height="10" rx="1" fill="#FFAA00" opacity="0.80"/>
              <rect x="924" y="80"  width="12" height="10" rx="1" fill="#FFD700" opacity="0.95"/>
              <rect x="945" y="80"  width="12" height="10" rx="1" fill="#FFC200" opacity="0.70"/>
              <rect x="882" y="100" width="12" height="10" rx="1" fill="#FFD700" opacity="0.60"/>
              <rect x="924" y="100" width="12" height="10" rx="1" fill="#FFD700" opacity="0.90"/>
              <rect x="945" y="100" width="12" height="10" rx="1" fill="#FFAA00" opacity="0.75"/>
              <rect x="882" y="120" width="12" height="10" rx="1" fill="#FFD700" opacity="0.95"/>
              <rect x="903" y="120" width="12" height="10" rx="1" fill="#FFC200" opacity="0.65"/>
              <rect x="924" y="140" width="12" height="10" rx="1" fill="#FFD700" opacity="0.85"/>
              <rect x="882" y="160" width="12" height="10" rx="1" fill="#FFAA00" opacity="0.70"/>
              <rect x="945" y="160" width="12" height="10" rx="1" fill="#FFD700" opacity="0.90"/>
              {/* Mid building grid */}
              <rect x="675" y="135" width="8" height="7" rx="1" fill="#FFD700" opacity="0.90"/>
              <rect x="693" y="135" width="8" height="7" rx="1" fill="#FFC200" opacity="0.60"/>
              <rect x="711" y="135" width="8" height="7" rx="1" fill="#FFD700" opacity="0.85"/>
              <rect x="675" y="152" width="8" height="7" rx="1" fill="#FFAA00" opacity="0.45"/>
              <rect x="711" y="152" width="8" height="7" rx="1" fill="#FFD700" opacity="0.75"/>
              <rect x="675" y="169" width="8" height="7" rx="1" fill="#FFD700" opacity="0.90"/>
              <rect x="693" y="169" width="8" height="7" rx="1" fill="#FFC200" opacity="0.55"/>
              {/* Scattered windows on other buildings */}
              <rect x="340" y="145" width="8" height="7" rx="1" fill="#FFD700" opacity="0.75"/>
              <rect x="358" y="165" width="8" height="7" rx="1" fill="#FFAA00" opacity="0.60"/>
              <rect x="495" y="155" width="8" height="7" rx="1" fill="#FFD700" opacity="0.80"/>
              <rect x="515" y="175" width="8" height="7" rx="1" fill="#FFC200" opacity="0.65"/>
              <rect x="495" y="195" width="8" height="7" rx="1" fill="#FFD700" opacity="0.50"/>
              <rect x="620" y="170" width="8" height="7" rx="1" fill="#FFD700" opacity="0.70"/>
              <rect x="640" y="190" width="8" height="7" rx="1" fill="#FFAA00" opacity="0.55"/>
              <rect x="980" y="215" width="8" height="7" rx="1" fill="#FFD700" opacity="0.80"/>
              <rect x="997" y="215" width="8" height="7" rx="1" fill="#FFC200" opacity="0.60"/>
              <rect x="1025" y="185" width="8" height="7" rx="1" fill="#FFD700" opacity="0.75"/>
              <rect x="1090" y="235" width="8" height="7" rx="1" fill="#FFD700" opacity="0.65"/>
              {/* Tower antenna beacon */}
              <circle cx="901" cy="38" r="3" fill="#FF4444" opacity="0.9"/>
            </>
          ) : (
            <>
              {/* Daytime windows — subtle light blue/gray */}
              <rect x="882" y="80"  width="12" height="10" rx="1" fill="#93c5fd" opacity="0.45"/>
              <rect x="903" y="80"  width="12" height="10" rx="1" fill="#bfdbfe" opacity="0.35"/>
              <rect x="924" y="80"  width="12" height="10" rx="1" fill="#93c5fd" opacity="0.45"/>
              <rect x="882" y="100" width="12" height="10" rx="1" fill="#93c5fd" opacity="0.30"/>
              <rect x="924" y="100" width="12" height="10" rx="1" fill="#bfdbfe" opacity="0.40"/>
              <rect x="675" y="135" width="8" height="7" rx="1" fill="#93c5fd" opacity="0.40"/>
              <rect x="711" y="135" width="8" height="7" rx="1" fill="#93c5fd" opacity="0.35"/>
              <rect x="675" y="152" width="8" height="7" rx="1" fill="#bfdbfe" opacity="0.25"/>
              <rect x="675" y="169" width="8" height="7" rx="1" fill="#93c5fd" opacity="0.40"/>
            </>
          )}
        </svg>

        {/* Left-side reading gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(100deg, var(--bg) 42%, transparent 100%)",
            transition: "background 0.6s ease",
          }}
        />
      </div>

      {/* ── Hero Content ──────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          padding: "clamp(32px, 6vw, 64px) clamp(20px, 5vw, 80px)",
        }}
      >
        <div style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* ① Badge */}
          <div
            className="hero-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              borderRadius: "0px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card-bg)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "var(--text-secondary)",
              fontSize: "13.5px",
              fontWeight: 700,
              width: "fit-content",
            }}
          >
            <AlertTriangle size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <span>Sri Lanka Local Service & Volunteer Network · Est. 2026</span>
          </div>

          {/* ② Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            <h1
              className="hero-line-1"
              style={{
                fontSize: "clamp(48px, 7vw, 80px)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Connecting
            </h1>
            <h1
              className="hero-line-2"
              style={{
                fontSize: "clamp(48px, 7vw, 80px)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "var(--accent)",
                margin: 0,
              }}
            >
              Homes & Skilled
            </h1>
            <h1
              className="hero-line-3"
              style={{
                fontSize: "clamp(48px, 7vw, 80px)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Local Workers.
            </h1>
          </div>

          {/* ③ Accent Bar */}
          <div
            className="hero-bar"
            style={{
              width: "80px",
              height: "5px",
              borderRadius: "0px",
              backgroundColor: "var(--accent)",
              transformOrigin: "left center",
            }}
          />

          {/* ④ Description */}
          <p
            className="hero-desc"
            style={{
              fontSize: "18px",
              lineHeight: 1.75,
              color: "var(--text-secondary)",
              maxWidth: "580px",
              margin: 0,
            }}
          >
            Find trusted village and town painters, tree cutters, plumbers, house cleaners, and PC technicians. Chat directly on the platform, view verified reviews, share job details, and connect seamlessly (with call and WhatsApp options).
          </p>

          {/* ⑤ Action Buttons — Dynamic matching state when logged in */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "14px",
              paddingTop: "6px",
            }}
          >
            {isAuthenticated && user ? (
              <>
                <Link
                  href={
                    user.role === "ADMIN"
                      ? "/admin/dashboard"
                      : user.role === "PROVIDER"
                      ? "/provider/dashboard"
                      : "/citizen/dashboard"
                  }
                  className="hero-cta"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "15px 32px",
                    borderRadius: "0px",
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-text)",
                    fontSize: "15px",
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 8px 24px var(--accent-glow)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <span>
                    {user.role === "ADMIN"
                      ? "Enter Operations Console"
                      : user.role === "PROVIDER"
                      ? "Enter Dispatch Console"
                      : "Enter Resident Console"}
                  </span>
                  <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="#services"
                  className="hero-cta"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "15px 32px",
                    borderRadius: "0px",
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-text)",
                    fontSize: "15px",
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 8px 24px var(--accent-glow)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <span>Browse Local Workers</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/provider/register"
                  className="hero-cta"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px 28px",
                    borderRadius: "0px",
                    border: "1.5px solid var(--border)",
                    backgroundColor: "var(--card-bg)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    color: "var(--text-primary)",
                    fontSize: "15px",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  Join as a Worker / Volunteer
                </Link>
              </>
            )}
          </div>

          {/* Stats Row (Dynamic from PostgreSQL Database) */}
          <div
            style={{
              paddingTop: "24px",
              marginTop: "4px",
              borderTop: "1px solid var(--border)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "16px",
              maxWidth: "520px",
            }}
          >
            {[
              { value: `${platformStats.totalWorkers ?? 2} Specialists`, label: "Registered Local Workers" },
              { value: `${platformStats.totalCompletedJobs ?? 2} Completed`, label: "Finished Neighborhood Jobs" },
              { value: `${platformStats.totalReviews ?? 2} Verified`, label: "Community Star Reviews" },
            ].map((stat) => (
              <div key={stat.label} className="hero-stat">
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    lineHeight: 1.1,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginTop: "5px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
