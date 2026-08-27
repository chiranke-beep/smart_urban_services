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
  Upload,
  Image as ImageIcon,
  Sun,
  Moon,
  DollarSign,
  IdCard,
  Plus,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";

const TRADES = [
  { id: "painting", label: "House Painter", icon: Paintbrush, color: "#f97316", defRate: 3500 },
  { id: "trees", label: "Tree Cutter & Yard Care", icon: Trees, color: "#10b981", defRate: 4000 },
  { id: "plumbing", label: "Plumber", icon: Wrench, color: "#06b6d4", defRate: 3200 },
  { id: "cleaning", label: "House Cleaner & Roof Wash", icon: Home, color: "#3b82f6", defRate: 2800 },
  { id: "tech", label: "Electric & PC Repair", icon: Laptop, color: "#8b5cf6", defRate: 3000 },
  { id: "odd_jobs", label: "Handyman & Masonry", icon: Hammer, color: "#eab308", defRate: 2500 },
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

const DEFAULT_NIC_PREVIEW = "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop";

export default function ProviderRegisterPage() {
  const router = useRouter();
  const { registerProvider } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Personal Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasWhatsApp, setHasWhatsApp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [locality, setLocality] = useState("");
  const [district, setDistrict] = useState("Colombo");

  // Step 2: Trade & Rates
  const [selectedTrades, setSelectedTrades] = useState<string[]>([TRADES[0].id]);
  const [experienceYears, setExperienceYears] = useState(5);
  const [dailyRate, setDailyRate] = useState(3500);

  // Step 3: NIC Document Upload & Payout
  const [nicNumber, setNicNumber] = useState("");
  const [nicDocumentUrl, setNicDocumentUrl] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"CASH_ON_HAND" | "BANK_TRANSFER">("CASH_ON_HAND");
  const [bankName, setBankName] = useState("Commercial Bank of Ceylon");
  const [accountNumber, setAccountNumber] = useState("");

  const validateNIC = (nic: string) => {
    const cleaned = nic.trim();
    const oldFormat = /^[0-9]{9}[vVxX]$/;
    const newFormat = /^[0-9]{12}$/;
    return oldFormat.test(cleaned) || newFormat.test(cleaned);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Read immediately for instant visual preview
    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result) {
        const base64Data = String(reader.result);
        setNicDocumentUrl(base64Data);

        // 2. Upload to server to get static URL
        try {
          const res = await fetch("http://localhost:5000/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64Data }),
          });
          const data = await res.json();
          if (data?.success && data?.url) {
            setNicDocumentUrl(data.url);
          }
        } catch {}
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!fullName.trim() || !phone.trim() || !locality.trim() || !email.trim() || !password.trim()) {
        setErrorMsg("Please enter your name, phone, town, email, and password.");
        return;
      }
    } else if (step === 2) {
      if (dailyRate < 1000) {
        setErrorMsg("Please enter a valid daily rate (minimum Rs. 1000).");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nicNumber.trim()) {
      setErrorMsg("Please enter your National Identity Card (NIC) number.");
      return;
    }
    if (!validateNIC(nicNumber)) {
      setErrorMsg("Invalid NIC format. Please enter 9 digits + 'V' (e.g. 882410928V) or 12 digits (e.g. 198824109281).");
      return;
    }

    setIsSubmitting(true);

    const tradeLabels = selectedTrades
      .map((id) => TRADES.find((t) => t.id === id)?.label)
      .filter(Boolean)
      .join(", ");

    try {
      await registerProvider({
        fullName: fullName.trim(),
        phone: phone.startsWith("+94") ? phone.trim() : `+94 ${phone.trim()}`,
        hasWhatsApp,
        email: email.trim(),
        password: password.trim(),
        locality: locality.trim(),
        district,
        trade: tradeLabels || "Technician",
        tradeType: selectedTrades[0] as any,
        experienceYears,
        nicNumber: nicNumber.trim(),
        nicFrontUrl: nicDocumentUrl,
        dailyRate,
        hourlyRate: Math.round(dailyRate / 6),
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

      {/* Top Header */}
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
            Join as a Worker
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

      {/* Main Registration Form */}
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
            maxWidth: "560px",
            backgroundColor: "var(--card-bg)",
            border: "1.5px solid var(--border)",
            padding: "clamp(24px, 5vw, 36px)",
            borderRadius: "0px",
            boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.7)" : "0 20px 40px -15px rgba(0, 0, 0, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Progress Header */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Step {step} of 3
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                {step === 1 ? "Personal Info" : step === 2 ? "Trade & Daily Pay" : "ID Card (NIC)"}
              </span>
            </div>

            <div style={{ width: "100%", height: "4px", backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", display: "flex" }}>
              <div
                style={{
                  width: `${(step / 3) * 100}%`,
                  height: "100%",
                  backgroundColor: "var(--accent)",
                  transition: "width 0.3s ease",
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

          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="auth-step-animate" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 4px 0" }}>
                  Your Contact Information
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                  Enter your details so local homeowners can contact you for jobs.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Kumara"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    fontWeight: 600,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="077 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
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
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sunil@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid var(--border)",
                      backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      outline: "none",
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                    Town / Area
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharagama, Heerassagala"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
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
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid var(--border)",
                      backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      outline: "none",
                      fontWeight: 600,
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
                  Create Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    fontWeight: 600,
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                <input
                  type="checkbox"
                  id="waCheck"
                  checked={hasWhatsApp}
                  onChange={(e) => setHasWhatsApp(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent)" }}
                />
                <label htmlFor="waCheck" style={{ cursor: "pointer", fontWeight: 600 }}>
                  I have WhatsApp on this phone number
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: Trade & Pay Rate */}
          {step === 2 && (
            <div className="auth-step-animate" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 4px 0" }}>
                  Your Work Skills & Rates
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                  Select all the trade skills you can perform (you can choose multiple).
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {TRADES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = selectedTrades.includes(t.id);

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (isSelected) {
                          if (selectedTrades.length > 1) {
                            setSelectedTrades(selectedTrades.filter((id) => id !== t.id));
                          }
                        } else {
                          setSelectedTrades([...selectedTrades, t.id]);
                        }
                      }}
                      style={{
                        padding: "12px",
                        border: `1.5px solid ${isSelected ? t.color : "var(--border)"}`,
                        backgroundColor: isSelected
                          ? isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.04)"
                          : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Icon size={18} color={t.color} />
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            border: `1.5px solid ${isSelected ? t.color : "var(--border)"}`,
                            backgroundColor: isSelected ? t.color : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                          }}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                      <span style={{ fontSize: "12.5px", fontWeight: 800 }}>{t.label}</span>
                    </div>
                  );
                })}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                  Years of Experience: <strong>{experienceYears} Years</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                  Standard Daily Charge (Rs.)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={100}
                  value={dailyRate}
                  onChange={(e) => setDailyRate(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff",
                    color: "var(--text-primary)",
                    fontSize: "15px",
                    fontWeight: 800,
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
                  Approx. Rs. {Math.round(dailyRate / 6)} / hour for quick tasks.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: NIC Document Upload */}
          {step === 3 && (
            <div className="auth-step-animate" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 4px 0" }}>
                  National Identity Card (NIC) Verification
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                  We verify your identity to protect both you and local homeowners.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                  National Identity Card (NIC) Number
                </label>
                <div style={{ display: "flex", border: "1px solid var(--border)" }}>
                  <input
                    type="text"
                    required
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
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: validateNIC(nicNumber) ? "#10b981" : "var(--text-secondary)",
                    }}
                  >
                    {validateNIC(nicNumber) ? "Valid" : "9 or 12 Digits"}
                  </div>
                </div>
              </div>

              {/* Working NIC Photo Upload */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
                  Upload Front of NIC / ID Card Photo
                </label>

                {!nicDocumentUrl ? (
                  <label
                    style={{
                      padding: "28px 16px",
                      border: "2px dashed var(--accent)",
                      backgroundColor: isDark ? "rgba(8,145,178,0.06)" : "rgba(8,145,178,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "var(--accent)",
                        color: "var(--accent-text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(8,145,178,0.3)",
                      }}
                    >
                      <Plus size={24} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                        + Click to Upload NIC / ID Photo
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                        Front side of your Sri Lanka NIC or Driving License (PNG, JPG)
                      </span>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      border: "1.5px solid #10b981",
                      backgroundColor: isDark ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        src={nicDocumentUrl}
                        alt="NIC Card Preview"
                        style={{
                          width: "180px",
                          height: "110px",
                          objectFit: "cover",
                          border: "1px solid var(--border)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: "6px",
                          right: "6px",
                          backgroundColor: "#10b981",
                          color: "#fff",
                          padding: "2px 6px",
                          fontSize: "10px",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <CheckCircle2 size={10} />
                        <span>Attached</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <label
                        style={{
                          padding: "6px 14px",
                          backgroundColor: "var(--accent)",
                          color: "var(--accent-text)",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Plus size={13} />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          style={{ display: "none" }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setNicDocumentUrl("")}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "transparent",
                          border: "none",
                          color: "#ef4444",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
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
                  fontWeight: 700,
                  fontSize: "13px",
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
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding: "11px 22px",
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "13.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(8,145,178,0.3)",
                }}
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  padding: "11px 24px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "13.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                }}
              >
                <span>{isSubmitting ? "Submitting..." : "Complete Registration"}</span>
                <Check size={15} />
              </button>
            )}
          </div>

          <div style={{ textAlign: "center", fontSize: "12px" }}>
            Already registered?{" "}
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 800, textDecoration: "underline" }}>
              Sign In here
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
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
          Back to Home
        </Link>
      </footer>
    </div>
  );
}
