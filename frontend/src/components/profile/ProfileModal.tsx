"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  MapPin,
  Calendar,
  Globe,
  Phone,
  Mail,
  Camera,
  ShieldCheck,
  CheckCircle,
  Truck,
  DollarSign,
  Briefcase,
  Crosshair,
  Info,
  Upload,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { decodeNicToBirthdayAndGender } from "@/utils/nicDecoder";
import { apiClient } from "@/services/api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}



// Interactive Leaflet Pin Map Picker for Citizens
function InteractivePinPicker({
  lat,
  lng,
  onChangeCoords,
  isDark,
}: {
  lat: number;
  lng: number;
  onChangeCoords: (newLat: number, newLng: number) => void;
  isDark: boolean;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isSubscribed = true;

    import("leaflet").then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Free OpenStreetMap tile server (No API key required)
      const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Sleek, small 20px vector SVG location pin (zero area obstruction)
      const smallPinIcon = L.divIcon({
        className: "custom-small-pin",
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 30px;
            cursor: grab;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
          ">
            <svg width="22" height="30" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="#10b981"/>
              <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
            </svg>
          </div>
        `,
        iconSize: [22, 30],
        iconAnchor: [11, 30],
      });

      const marker = L.marker([lat, lng], {
        icon: smallPinIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // Drag event
      marker.on("dragend", (e: any) => {
        const position = e.target.getLatLng();
        onChangeCoords(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)));
      });

      // Click to place pin anywhere on map
      map.on("click", (e: any) => {
        const clickedLat = Number(e.latlng.lat.toFixed(6));
        const clickedLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([clickedLat, clickedLng]);
        map.panTo([clickedLat, clickedLng]);
        onChangeCoords(clickedLat, clickedLng);
      });

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when props change
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: "0px", overflow: "hidden", border: "1.5px solid var(--border)" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "8px",
          backgroundColor: isDark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.95)",
          padding: "4px 8px",
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--text-primary)",
          border: "1px solid var(--border)",
          pointerEvents: "none",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <MapPin size={12} color="#10b981" />
        <span>Click or drag pin to set exact house location</span>
      </div>
    </div>
  );
}

export function ProfileModal({ isOpen, onClose, onProfileUpdated }: ProfileModalProps) {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || "");
  const [homeAddress, setHomeAddress] = useState(user?.homeAddress || "Heerassagala, Kandy");
  const [savedLat, setSavedLat] = useState<number>(user?.savedLat || 7.264242);
  const [savedLng, setSavedLng] = useState<number>(user?.savedLng || 80.621701);
  const [birthday, setBirthday] = useState<string>(user?.birthday ? user.birthday.split("T")[0] : "1995-06-15");
  const [gender, setGender] = useState<string>(user?.gender || "Male");
  const [language, setLanguage] = useState<string>(user?.language || "English");

  const [trade, setTrade] = useState<string>(user?.trade || "Technician & Craftsman");
  const [dailyRate, setDailyRate] = useState<number>(user?.dailyRate || 3500);
  const [vehicleType, setVehicleType] = useState<string>(user?.vehicleType && user.vehicleType !== "Service Vehicle" ? user.vehicleType : "Professional Trade Kit & Hand Tools");
  const [plateNumber, setPlateNumber] = useState<string>(user?.plateNumber || "");

  // Auto-decode Birthday & Gender from Sri Lankan NIC
  useEffect(() => {
    if (user?.nicNumber) {
      const decoded = decodeNicToBirthdayAndGender(user.nicNumber);
      if (decoded) {
        setBirthday(decoded.birthday);
        setGender(decoded.gender);
      }
    }
  }, [user?.nicNumber]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const numericId = user?.id ? String(user.id).replace(/\D/g, "") : "1";
  const isCitizen = user?.role === "HOMEOWNER" || user?.role !== "PROVIDER";

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);

    // 1. Read immediately for instant visual feedback
    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result) {
        const base64Data = String(reader.result);
        setProfilePicture(base64Data);

        // 2. Upload to server to get permanent static URL
        try {
          const res = await fetch("http://localhost:5000/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64Data }),
          });
          const data = await res.json();
          if (data?.success && data?.url) {
            setProfilePicture(data.url);
          }
        } catch {
          // Keep base64Data if network issue
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setProfilePicture("");
    try {
      await apiClient(`/users/profile/${numericId}`, {
        method: "PATCH",
        body: JSON.stringify({ profilePicture: "" }),
      });
      updateUser({ profilePicture: undefined });
      if (onProfileUpdated) onProfileUpdated();
    } catch (err: any) {
      console.warn("[Remove photo DB sync notice]:", err.message);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      apiClient<{ success: boolean; data?: any }>(`/users/profile/${numericId || 2}`)
        .then((res) => {
          if (res?.data) {
            const d = res.data;
            if (d.fullName) setFullName(d.fullName);
            if (d.phone) setPhone(d.phone);
            setProfilePicture(d.profilePicture || "");
            if (!d.profilePicture) {
              updateUser({ profilePicture: undefined });
            }
            if (d.homeAddress) setHomeAddress(d.homeAddress);
            if (d.savedLat) setSavedLat(Number(d.savedLat));
            if (d.savedLng) setSavedLng(Number(d.savedLng));
            if (d.birthday) {
              setBirthday(d.birthday.split("T")[0]);
            } else if (d.nicNumber || user?.nicNumber) {
              const dec = decodeNicToBirthdayAndGender(d.nicNumber || user?.nicNumber);
              if (dec) setBirthday(dec.birthday);
            }

            if (d.gender) {
              setGender(d.gender);
            } else if (d.nicNumber || user?.nicNumber) {
              const dec = decodeNicToBirthdayAndGender(d.nicNumber || user?.nicNumber);
              if (dec) setGender(dec.gender);
            }

            if (d.language) setLanguage(d.language);
            if (d.trade) setTrade(d.trade);
            if (d.dailyRate) setDailyRate(Number(d.dailyRate));
            if (d.vehicleType) setVehicleType(d.vehicleType);
            if (d.plateNumber) setPlateNumber(d.plateNumber);
          }
        })
        .catch((err) => console.warn("[Profile fetch notice]:", err.message));
    }
  }, [isOpen, numericId]);

  if (!isOpen || !mounted) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const patchRes = await apiClient<{ success: boolean; profilePicture?: string }>(`/users/profile/${numericId}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName,
          phone,
          profilePicture,
          homeAddress: isCitizen ? homeAddress : undefined,
          savedLat: isCitizen ? savedLat : undefined,
          savedLng: isCitizen ? savedLng : undefined,
          birthday,
          gender,
          language,
          trade: !isCitizen ? trade : undefined,
          dailyRate: !isCitizen ? dailyRate : undefined,
          vehicleType: !isCitizen ? vehicleType : undefined,
          plateNumber: !isCitizen ? plateNumber : undefined,
        }),
      });

      const savedPic = patchRes?.profilePicture || "";
      setProfilePicture(savedPic);

      // Update session localStorage cache
      const stored = localStorage.getItem("smart_urban_auth_session");
      if (stored) {
        const session = JSON.parse(stored);
        if (session?.user) {
          session.user.fullName = fullName;
          session.user.phone = phone;
          session.user.profilePicture = savedPic || undefined;
          if (isCitizen) {
            session.user.homeAddress = homeAddress;
            session.user.savedLat = savedLat;
            session.user.savedLng = savedLng;
          }
          session.user.birthday = birthday;
          session.user.gender = gender;
          session.user.language = language;
          if (!isCitizen) {
            session.user.trade = trade;
            session.user.dailyRate = dailyRate;
            session.user.vehicleType = vehicleType;
            session.user.plateNumber = plateNumber;
          }
          localStorage.setItem("smart_urban_auth_session", JSON.stringify(session));
        }
      }

      updateUser({
        fullName,
        phone,
        profilePicture: savedPic || undefined,
        homeAddress: isCitizen ? homeAddress : undefined,
        savedLat: isCitizen ? savedLat : undefined,
        savedLng: isCitizen ? savedLng : undefined,
        birthday,
        gender,
        language,
        trade: !isCitizen ? trade : undefined,
        dailyRate: !isCitizen ? dailyRate : undefined,
        vehicleType: !isCitizen ? vehicleType : undefined,
        plateNumber: !isCitizen ? plateNumber : undefined,
      });

      setSaveSuccess(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      alert("Error saving profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const modalJSX = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDark ? "rgba(0, 0, 0, 0.85)" : "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(8px, 2vw, 20px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "620px",
          maxHeight: "94vh",
          overflowY: "auto",
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          border: "1.5px solid var(--accent)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
          padding: "clamp(16px, 3.5vw, 32px)",
          borderRadius: "0px",
          position: "relative",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            color: isDark ? "#94a3b8" : "#64748b",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              backgroundColor: "rgba(8,145,178,0.15)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: isDark ? "#ffffff" : "#0f172a" }}>
              My Profile {isCitizen ? "& Saved Home Pin" : "& Work Credentials"}
            </h2>
            <p style={{ fontSize: "12.5px", color: isDark ? "#94a3b8" : "#64748b", margin: 0 }}>
              {isCitizen ? "Homeowner details & fixed property location pin on map" : "Service provider trade skills, certified expertise & profile"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Profile Photo Real Upload Box (+ sign placeholder) */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: isDark ? "#cbd5e1" : "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
              Profile Photo:
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {profilePicture ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={profilePicture}
                    alt="Profile Photo"
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2.5px solid var(--accent)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                  {isUploadingPhoto && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "10px", fontWeight: 700 }}>
                      ...
                    </div>
                  )}
                </div>
              ) : (
                <label
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "50%",
                    border: "2px dashed var(--accent)",
                    backgroundColor: isDark ? "rgba(8,145,178,0.1)" : "rgba(8,145,178,0.06)",
                    color: "var(--accent)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  title="Click to Upload Profile Photo"
                >
                  <Plus size={26} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />
                </label>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    padding: "7px 16px",
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-text)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    width: "fit-content",
                    borderRadius: "2px",
                  }}
                >
                  <Plus size={14} />
                  <span>{profilePicture ? "Change Photo" : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />
                </label>

                {profilePicture ? (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      padding: 0,
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    Remove Photo
                  </button>
                ) : (
                  <span style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>
                    Click the + icon or button to upload your personal photo (PNG, JPG)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Full Name & Phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: isDark ? "#cbd5e1" : "#475569", textTransform: "uppercase", marginBottom: "4px" }}>
                Full Name:
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  border: isDark ? "1.5px solid #334155" : "1.5px solid #cbd5e1",
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: "13.5px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: isDark ? "#cbd5e1" : "#475569", textTransform: "uppercase", marginBottom: "4px" }}>
                Phone Number:
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  border: isDark ? "1.5px solid #334155" : "1.5px solid #cbd5e1",
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: "13.5px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Birthday, Gender & Language */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <label style={{ fontSize: "11.5px", fontWeight: 800, color: isDark ? "#cbd5e1" : "#475569", textTransform: "uppercase" }}>
                  Birthday:
                </label>
                {user?.nicNumber && (
                  <span style={{ fontSize: "10px", color: "#10b981", fontWeight: 800 }}>From NIC</span>
                )}
              </div>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  border: isDark ? "1.5px solid #334155" : "1.5px solid #cbd5e1",
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: "12.5px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <label style={{ fontSize: "11.5px", fontWeight: 800, color: isDark ? "#cbd5e1" : "#475569", textTransform: "uppercase" }}>
                  Gender:
                </label>
                {user?.nicNumber && (
                  <span style={{ fontSize: "10px", color: "#10b981", fontWeight: 800 }}>From NIC</span>
                )}
              </div>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  border: isDark ? "1.5px solid #334155" : "1.5px solid #cbd5e1",
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: "12.5px",
                  outline: "none",
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: isDark ? "#cbd5e1" : "#475569", textTransform: "uppercase", marginBottom: "4px" }}>
                Language:
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  border: isDark ? "1.5px solid #334155" : "1.5px solid #cbd5e1",
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: "12.5px",
                  outline: "none",
                }}
              >
                <option value="English">English</option>
                <option value="Sinhala">Sinhala (සිංහල)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
              </select>
            </div>
          </div>

          {/* CITIZEN ONLY: Saved Home Address & Interactive Map Pin Picker */}
          {isCitizen && (
            <div
              style={{
                padding: "16px",
                backgroundColor: isDark ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.04)",
                border: "1.5px solid rgba(16,185,129,0.3)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 800, color: "#10b981" }}>
                  <MapPin size={16} />
                  <span>Saved Home Address & Map Pin (Fixed Property)</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const fallbackToIp = () => {
                      fetch("https://ipapi.co/json/")
                        .then((r) => r.json())
                        .then((data) => {
                          if (data?.latitude && data?.longitude) {
                            const lat = Number(Number(data.latitude).toFixed(6));
                            const lng = Number(Number(data.longitude).toFixed(6));
                            setSavedLat(lat);
                            setSavedLng(lng);
                            if (data.city || data.region) {
                              setHomeAddress(`${data.city || ""}, ${data.region || ""}`.trim());
                            }
                          }
                        })
                        .catch(() => {});
                    };

                    if (typeof window !== "undefined" && "geolocation" in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const lat = Number(pos.coords.latitude.toFixed(6));
                          const lng = Number(pos.coords.longitude.toFixed(6));
                          setSavedLat(lat);
                          setSavedLng(lng);

                          // Reverse geocode to get street name
                          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                            .then((r) => r.json())
                            .then((d) => {
                              if (d?.display_name) {
                                const short = d.address?.road || d.address?.suburb || d.address?.city || d.display_name.split(",").slice(0, 3).join(", ");
                                setHomeAddress(short);
                              }
                            })
                            .catch(() => {});
                        },
                        (err) => {
                          console.log("[Geolocation fallback to IP]:", err.message);
                          fallbackToIp();
                        },
                        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
                      );
                    } else {
                      fallbackToIp();
                    }
                  }}
                  style={{
                    padding: "5px 10px",
                    backgroundColor: "transparent",
                    border: "1px solid #10b981",
                    color: "#10b981",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Crosshair size={13} />
                  <span>Snap to Current House Location</span>
                </button>
              </div>

              {/* Quick Jump Town Pills */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b", marginBottom: "6px" }}>
                  Jump to Town / Area:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {[
                    { name: "Heerassagala (Kandy)", lat: 7.264242, lng: 80.621701 },
                    { name: "Kandy Town", lat: 7.2906, lng: 80.6337 },
                    { name: "Colombo 07", lat: 6.9061, lng: 79.8708 },
                    { name: "Maharagama", lat: 6.8485, lng: 79.9265 },
                    { name: "Nugegoda", lat: 6.8724, lng: 79.8997 },
                    { name: "Galle", lat: 6.0535, lng: 80.221 },
                    { name: "Gampaha", lat: 7.084, lng: 79.994 },
                    { name: "Kurunegala", lat: 7.4863, lng: 80.3623 },
                  ].map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => {
                        setSavedLat(t.lat);
                        setSavedLng(t.lng);
                        setHomeAddress(t.name);
                      }}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: isDark ? "#cbd5e1" : "#475569", textTransform: "uppercase", marginBottom: "4px" }}>
                  Property / House Street Address:
                </label>
                <input
                  type="text"
                  required
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  placeholder="e.g. 42/B, Heerassagala Road, Kandy"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Interactive Map Pin Component */}
              <InteractivePinPicker
                lat={savedLat}
                lng={savedLng}
                onChangeCoords={(newLat, newLng) => {
                  setSavedLat(newLat);
                  setSavedLng(newLng);
                }}
                isDark={isDark}
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b" }}>
                <span>Saved Coordinates: <strong>{savedLat.toFixed(5)}, {savedLng.toFixed(5)}</strong></span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>Fixed pin ready for workers</span>
              </div>
            </div>
          )}

          {/* PROVIDER ONLY: Certified Trades & Skills */}
          {!isCitizen && (
            <div
              style={{
                padding: "16px",
                backgroundColor: isDark ? "rgba(8,145,178,0.08)" : "rgba(8,145,178,0.05)",
                border: "1.5px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase" }}>
                  Selected Certified Trades (Broadcast Matching):
                </div>
                <span style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Toggle your active trades
                </span>
              </div>

              {/* Multi-Select Trade Pills (Identical to Registration) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { id: "painting", label: "House Painter" },
                  { id: "trees", label: "Tree Cutter & Yard Care" },
                  { id: "plumbing", label: "Plumber & Pipes" },
                  { id: "cleaning", label: "House Cleaner & Roof Wash" },
                  { id: "tech", label: "Electric & PC Repair" },
                  { id: "odd_jobs", label: "Handyman & Masonry" },
                ].map((t) => {
                  const isSelected =
                    trade.toLowerCase().includes(t.id) ||
                    trade.toLowerCase().includes(t.label.toLowerCase().slice(0, 5));
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        let currentList = trade
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        if (isSelected) {
                          currentList = currentList.filter(
                            (s) => !s.toLowerCase().includes(t.label.toLowerCase().slice(0, 5))
                          );
                          if (currentList.length === 0) currentList = [t.label];
                        } else {
                          currentList.push(t.label);
                        }
                        setTrade(currentList.join(", "));
                      }}
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        backgroundColor: isSelected
                          ? (isDark ? "rgba(8,145,178,0.25)" : "#e0f2fe")
                          : (isDark ? "rgba(255,255,255,0.04)" : "#ffffff"),
                        border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                        color: isSelected ? "var(--accent)" : "var(--text-primary)",
                        fontSize: "12px",
                        fontWeight: isSelected ? 800 : 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{t.label}</span>
                      {isSelected && <CheckCircle size={14} color="var(--accent)" />}
                    </button>
                  );
                })}
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "4px" }}>
                  Active Specialization Summary:
                </label>
                <input
                  type="text"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  placeholder="e.g. Master Painter, Tree Felling & Garden Landscaping"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px",
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                color: isDark ? "#cbd5e1" : "#475569",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: "10px 24px",
                backgroundColor: saveSuccess ? "#10b981" : "var(--accent)",
                color: "var(--accent-text)",
                border: "none",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 14px rgba(8,145,178,0.3)",
              }}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle size={15} />
                  <span>Changes Saved!</span>
                </>
              ) : (
                <span>{isSaving ? "Saving..." : "Save Profile"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
