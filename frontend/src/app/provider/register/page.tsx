"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { AuthBackground } from "@/components/auth/AuthBackground";
import {
  Wrench,
  Paintbrush,
  Trees,
  Home,
  Laptop,
  Hammer,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Award,
  Sun,
  Moon,
  Zap,
} from "lucide-react";

const TRADES = [
  { id: "painting", label: "House Painter & Wall Specialist", icon: Paintbrush, color: "#f97316", defRate: 3500 },
  { id: "trees", label: "Tree Cutter & Yard Care", icon: Trees, color: "#10b981", defRate: 4000 },
  { id: "plumbing", label: "Plumber & Pipe Technician", icon: Wrench, color: "#06b6d4", defRate: 3200 },
  { id: "cleaning", label: "House Cleaner & Roof Pressure Wash", icon: Home, color: "#3b82f6", defRate: 2800 },
  { id: "tech", label: "PC & Electrical Technician", icon: Laptop, color: "#8b5cf6", defRate: 3000 },
  { id: "odd_jobs", label: "Odd Jobs & Masonry Helper", icon: Hammer, color: "#eab308", defRate: 2500 },
];

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

export default function ProviderRegisterPage() {
  const router = useRouter();
  const { registerProvider } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Personal & Contact
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasWhatsApp, setHasWhatsApp] = useState(true);
  const [email, setEmail] = useState("");
  const [locality, setLocality] = useState("");
  const [district, setDistrict] = useState("Colombo");

  // Step 2: Trade & Skills
  const [selectedTrade, setSelectedTrade] = useState(TRADES[0]);
  const [experienceYears, setExperienceYears] = useState(5);
  const [skills, setSkills] = useState<string[]>(["Residential Color-Wash", "Exterior Weatherproof"]);

  // Step 3: NIC & Verification
  const [nicNumber, setNicNumber] = useState("");
  const [nvqCert, setNvqCert] = useState("NVQ Level 3/4 Vocational Certificate");
  const [vehicleType, setVehicleType] = useState("Three Wheeler & Ladders");
  const [plateNumber, setPlateNumber] = useState("WP-ABX-8821");

  // Step 4: Rates & Payout
  const [dailyRate, setDailyRate] = useState(3500);
  const [hourlyRate, setHourlyRate] = useState(600);
  const [payoutMethod, setPayoutMethod] = useState<"CASH_ON_HAND" | "BANK_TRANSFER">("CASH_ON_HAND");
  const [bankName, setBankName] = useState("Commercial Bank of Ceylon");
  const [accountNumber, setAccountNumber] = useState("");

  // Validate Sri Lanka NIC format
  const validateNIC = (nic: string) => {
    const cleaned = nic.trim();
    const oldFormat = /^[0-9]{9}[vVxX]$/;
    const newFormat = /^[0-9]{12}$/;
    return oldFormat.test(cleaned) || newFormat.test(cleaned);
  };

  const handleNext = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!fullName.trim() || !phone.trim() || !locality.trim()) {
        setErrorMsg("Please fill in your name, contact phone, and town base.");
        return;
      }
    } else if (step === 3) {
      if (!nicNumber.trim()) {
        setErrorMsg("Please enter your Sri Lanka National Identity Card (NIC) number.");
        return;
      }
      if (!validateNIC(nicNumber)) {
        setErrorMsg("Invalid NIC format. Must be either 9 digits + 'V' (e.g. 882410928V) or 12 digits (e.g. 198824109281).");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      await registerProvider({
        fullName: fullName.trim(),
        phone: phone.startsWith("+94") ? phone.trim() : `+94 ${phone.trim()}`,
        hasWhatsApp,
        email: email.trim() || undefined,
        locality: locality.trim(),
        district,
        trade: selectedTrade.label,
        tradeType: selectedTrade.id as any,
        skills,
        experienceYears,
        nicNumber: nicNumber.trim(),
        nvqCertificateName: nvqCert,
        vehicleType,
        plateNumber,
        dailyRate,
        hourlyRate,
        payoutMethod,
        bankName: payoutMethod === "BANK_TRANSFER" ? bankName : undefined,
        accountNumber: payoutMethod === "BANK_TRANSFER" ? accountNumber : undefined,
      });

      router.push("/provider/dashboard");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit registration. Please try again.");
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
      <AuthBackground variant="provider" />
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

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 700 }}>
            Worker Registration Portal
          </span>
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
        </div>
      </header>

      {/* ── Multi-Step Form Container ── */}
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
            maxWidth: "680px",
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
          {/* Top Progress Tracker */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--accent)", letterSpacing: "0.05em" }}>
                Step {step} of 4: {step === 1 && "Personal & Base Location"}
                {step === 2 && "Trade & Skills"}
                {step === 3 && "NIC & Credentials"}
                {step === 4 && "Rates & Preview"}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-secondary)" }}>
                {step * 25}% Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ height: "4px", width: "100%", backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }}>
              <div
                style={{
                  height: "100%",
                  width: `${step * 25}%`,
                  backgroundColor: "var(--accent)",
                  transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
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

          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: PERSONAL & CONTACT INFORMATION
             ═══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div key="step1" className="auth-step-animate" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 4px 0" }}>
                  Let&apos;s start with your contact details.
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                  Homeowners will use this to call, WhatsApp, or request direct quotes.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                  Full Legal Name
                </label>
                <input
                  type="text"
                  placeholder="Kamal Perera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="071 987 6543"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    Registered District
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
                  Town / Locality Base (e.g. Nugegoda, Maharagama, Peradeniya)
                </label>
                <input
                  type="text"
                  placeholder="Nugegoda East"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
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

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px",
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                  border: "1px solid var(--border)",
                }}
              >
                <input
                  type="checkbox"
                  id="waCheck"
                  checked={hasWhatsApp}
                  onChange={(e) => setHasWhatsApp(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent)" }}
                />
                <label htmlFor="waCheck" style={{ fontSize: "12.5px", cursor: "pointer", fontWeight: 600 }}>
                  Allow homeowners to contact me on <strong>WhatsApp</strong> directly using this number.
                </label>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: TRADE & SKILLS SELECTION
             ═══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div key="step2" className="auth-step-animate" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 4px 0" }}>
                  Select your primary skilled trade.
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                  This dictates what dispatch broadcasts and neighborhood jobs you receive.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {TRADES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = selectedTrade.id === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTrade(t);
                        setDailyRate(t.defRate);
                      }}
                      style={{
                        padding: "14px",
                        border: `1.5px solid ${isSelected ? t.color : "var(--border)"}`,
                        backgroundColor: isSelected
                          ? isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)"
                          : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Icon size={20} color={t.color} />
                        {isSelected && <Check size={15} color={t.color} />}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 800 }}>{t.label}</span>
                    </div>
                  );
                })}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                  Years of Professional Experience: <strong>{experienceYears} Years</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={35}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: NIC VALIDATION & CERTIFICATE PROOF
             ═══════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div key="step3" className="auth-step-animate" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 4px 0" }}>
                  National ID (NIC) & Credentials.
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                  Mandatory for all workers to protect neighborhood homeowners and prevent fraud.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                  Sri Lanka National Identity Card (NIC Number)
                </label>
                <div style={{ display: "flex", border: "1px solid var(--border)" }}>
                  <input
                    type="text"
                    placeholder="198824109281 or 882410928V"
                    value={nicNumber}
                    onChange={(e) => setNicNumber(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      border: "none",
                      backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      outline: "none",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  />
                  <div style={{ padding: "10px 12px", backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: validateNIC(nicNumber) ? "#10b981" : "var(--text-secondary)" }}>
                    {validateNIC(nicNumber) ? "Valid Format" : "9-digit / 12-digit"}
                  </div>
                </div>
              </div>

              {/* Vocational Certificate Simulator */}
              <div
                style={{
                  padding: "16px",
                  border: "1.5px dashed var(--border)",
                  backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textAlign: "center",
                }}
              >
                <Award size={26} color="var(--accent)" />
                <div style={{ fontSize: "13px", fontWeight: 800 }}>
                  Trade NVQ or Vocational Certificate (Optional)
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                  Upload NVQ Level 3/4 or apprentice reference for instant Gold Verified badge.
                </div>
                <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700 }}>
                  {nvqCert} (Attached)
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                    Service Transport Vehicle
                  </label>
                  <input
                    type="text"
                    placeholder="Three Wheeler & Ladders"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
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
                    Plate Number
                  </label>
                  <input
                    type="text"
                    placeholder="WP-ABX-8821"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid var(--border)",
                      backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                      color: "var(--text-primary)",
                      fontSize: "13.5px",
                      outline: "none",
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 4: RATES & PROFILE PREVIEW
             ═══════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div key="step4" className="auth-step-animate" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 4px 0" }}>
                  Service Rates & Pricing.
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                  Specify your expected daily or hourly rate in Sri Lankan Rupees (LKR).
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                    Standard Daily Rate
                  </label>
                  <div style={{ display: "flex", border: "1px solid var(--border)", backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff" }}>
                    <span style={{ padding: "10px 12px", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", fontSize: "12px", fontWeight: 800, borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", color: "var(--text-secondary)" }}>
                      LKR
                    </span>
                    <input
                      type="number"
                      min={1000}
                      max={50000}
                      step={500}
                      value={dailyRate || ""}
                      onChange={(e) => {
                        const val = Math.min(50000, Math.max(0, Number(e.target.value)));
                        setDailyRate(val);
                      }}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--text-primary)",
                        fontSize: "15px",
                        fontWeight: 900,
                        outline: "none",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
                    Typical range: LKR 2,500 – 10,000 / day
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                    Hourly / Inspection Rate
                  </label>
                  <div style={{ display: "flex", border: "1px solid var(--border)", backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff" }}>
                    <span style={{ padding: "10px 12px", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", fontSize: "12px", fontWeight: 800, borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", color: "var(--text-secondary)" }}>
                      LKR
                    </span>
                    <input
                      type="number"
                      min={300}
                      max={15000}
                      step={100}
                      value={hourlyRate || ""}
                      onChange={(e) => {
                        const val = Math.min(15000, Math.max(0, Number(e.target.value)));
                        setHourlyRate(val);
                      }}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--text-primary)",
                        fontSize: "15px",
                        fontWeight: 900,
                        outline: "none",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
                    Typical range: LKR 500 – 2,500 / hr
                  </span>
                </div>
              </div>

              {/* Live Card Preview */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
                  Your Public Verified Worker Card Preview:
                </span>
                <div
                  style={{
                    padding: "16px",
                    border: "1.5px solid var(--accent)",
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        backgroundColor: selectedTrade.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        color: "#ffffff",
                        fontSize: "16px",
                      }}
                    >
                      {fullName ? fullName.charAt(0).toUpperCase() : "W"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800 }}>{fullName || "Worker Name"}</span>
                        <ShieldCheck size={14} color="#10b981" />
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {selectedTrade.label} · {experienceYears} yrs exp
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--accent)", fontWeight: 700 }}>
                        {locality}, {district}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 900, color: "#10b981" }}>
                      Rs. {dailyRate.toLocaleString()} <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>/ day</span>
                    </div>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                      Rs. {hourlyRate.toLocaleString()} <span style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)" }}>/ hr</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Step Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <Link href="/login" style={{ fontSize: "12px", color: "var(--text-secondary)", textDecoration: "none", fontWeight: 700 }}>
                Already registered? Sign In
              </Link>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding: "11px 22px",
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                  border: "none",
                  fontSize: "13.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px var(--accent-glow)",
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <span>Continue to Step {step + 1}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <ShieldCheck size={16} />
                <span>Submit & Enter Provider Portal</span>
              </button>
            )}
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
        <span>Smart Urban Services Sri Lanka · Worker Empowerment</span>
        <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontWeight: 700 }}>
          Back to Directory
        </Link>
      </footer>
    </div>
  );
}
