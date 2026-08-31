"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  X,
  PhoneCall,
  ShieldCheck,
  Paperclip,
} from "lucide-react";
import { JobRequest } from "@/types/job";
import { ChatMessage } from "@/types/chat";
import { chatService } from "@/services/chatService";
import { socketService } from "@/services/socketService";
import { jobService } from "@/services/jobService";
import { formatCurrency, formatRelativeTime } from "@/utils/formatters";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/services/api";

interface LiveChatDockProps {
  job: JobRequest;
  onClose: () => void;
}

export function LiveChatDock({ job, onClose }: LiveChatDockProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentQuotePrice, setCurrentQuotePrice] = useState<number>(job.quotation?.amountLKR || job.costLKR || 3500);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef<number>(0);
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const worker = job.assignedWorker;

  const scrollToBottom = (smooth = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    setCurrentQuotePrice(job.quotation?.amountLKR || job.costLKR || 3500);
  }, [job.costLKR, job.quotation?.amountLKR]);

  useEffect(() => {
    // Initial fetch from DB
    chatService.fetchMessages(job.id).then((msgs) => {
      setMessages(msgs);
    });
    socketService.joinJob(job.id);

    const unsubscribe = socketService.onNewMessage((newMsg: ChatMessage) => {
      if (newMsg && newMsg.jobId === job.id) {
        chatService.receiveExternalMessage(newMsg);
        setMessages((prev) => {
          // Only deduplicate by ID — don't block messages with same text from other user
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    });

    const unsubQuote = socketService.onQuotationUpdated((data) => {
      if (data.jobId === job.id) {
        setCurrentQuotePrice(data.amountLKR);
      }
    });

    // Poll DB every 5s as a reliable fallback to catch any missed socket messages
    const pollInterval = setInterval(() => {
      chatService.fetchMessages(job.id).then((msgs) => {
        setMessages((prev) => {
          // Avoid triggering state update and re-render if messages have not changed
          if (
            msgs.length === prev.length &&
            msgs.every((m, idx) => m.id === prev[idx]?.id)
          ) {
            return prev;
          }
          return msgs;
        });
      });
    }, 5000);

    return () => {
      unsubscribe();
      unsubQuote();
      clearInterval(pollInterval);
    };
  }, [job.id]);

  useEffect(() => {
    // Only scroll the internal chat container when new messages arrive or on first load
    if (messages.length > prevMessagesCountRef.current) {
      scrollToBottom(prevMessagesCountRef.current > 0);
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const senderRole = user?.role === "PROVIDER" ? "worker" : "user";
    const senderName = user?.fullName || (senderRole === "user" ? "Homeowner" : "Technician");
    const userMsg = chatService.sendMessage(job.id, input, senderRole, senderName);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
  };

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("photo", file);

      const API_HOST = getApiBaseUrl();
      const res = await fetch(`${API_HOST}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const senderRole = user?.role === "PROVIDER" ? "worker" : "user";
        const senderName = user?.fullName || (senderRole === "user" ? "Homeowner" : "Technician");
        const msg = chatService.sendMessage(
          job.id,
          input.trim() || "Shared a photo",
          senderRole,
          senderName,
          data.url
        );
        setMessages((prev) => [...prev, msg]);
        setInput("");
      }
    } catch (err: any) {
      console.warn("[Upload error]:", err.message);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "640px",
        maxHeight: "85vh",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        borderRadius: "0px",
        backgroundColor: "var(--card-bg)",
        border: "1.5px solid var(--accent)",
        boxShadow: "0 20px 48px -12px rgba(0,0,0,0.4)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Chat Header */}
      {(() => {
        const isProvider = user?.role === "PROVIDER";
        const partnerName = isProvider ? (job.citizenName || "Homeowner") : (worker?.name || "Service Provider Dispatch");
        const partnerPhone = isProvider ? job.citizenPhone : worker?.phone;
        const partnerAvatarBg = isProvider ? "#0284c7" : (worker?.avatarBg || "var(--accent)");
        const partnerInitials = partnerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || (isProvider ? "HO" : "SP");
        const partnerSubtext = isProvider
          ? `Citizen Request #${job.id} · ${job.locality}`
          : (worker ? `Active on Job #${job.id} · ${job.locality}` : `Awaiting Dispatch Acceptance · ${job.locality}`);

        return (
          <div
            style={{
              padding: "14px 16px",
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "var(--accent)",
              color: isDark ? "#ffffff" : "var(--accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border)",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: partnerAvatarBg,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {partnerInitials}
              </div>
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {partnerName}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.85, display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981", borderRadius: "50%", flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                    {partnerSubtext}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              {partnerPhone && (
                <a
                  href={`tel:${partnerPhone}`}
                  style={{
                    color: "inherit",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={isProvider ? "Call Homeowner" : "Call Worker"}
                >
                  <PhoneCall size={16} />
                </a>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Interactive Quotation & Acceptance Banner */}
      <div
        style={{
          padding: "10px 16px",
          backgroundColor: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
          borderBottom: "1px solid rgba(16,185,129,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          fontSize: "12.5px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={16} color="#10b981" />
          <span style={{ fontWeight: 700, color: isDark ? "#ffffff" : "#0f172a" }}>
            Agreed Fee: <span style={{ color: "#10b981", fontWeight: 800 }}>{formatCurrency(currentQuotePrice)}</span>
          </span>
        </div>

        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          Direct Payment
        </div>
      </div>

      {/* Chat Messages Scroll Feed */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === (user?.role === "PROVIDER" ? "worker" : "user");
          const isSys = msg.sender === "system";

          if (isSys) {
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: "center",
                  fontSize: "11.5px",
                  color: "var(--text-secondary)",
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  padding: "4px 12px",
                  borderRadius: "0px",
                  border: "1px dashed var(--border)",
                  textAlign: "center",
                  maxWidth: "90%",
                }}
              >
                {msg.text}
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "80%",
              }}
            >
              <div
                style={{
                  padding: msg.attachmentUrl ? "8px" : "10px 14px",
                  borderRadius: "0px",
                  backgroundColor: isUser
                    ? "var(--accent)"
                    : isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(15,23,42,0.06)",
                  color: isUser ? "var(--accent-text)" : "var(--text-primary)",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  fontWeight: isUser ? 600 : 400,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                {msg.attachmentUrl && (
                  <div
                    onClick={() => setPreviewPhotoUrl(msg.attachmentUrl || null)}
                    style={{
                      cursor: "pointer",
                      display: "block",
                      marginBottom: msg.text ? "8px" : "0",
                      position: "relative",
                    }}
                    title="Click to view full photo"
                  >
                    <img
                      src={msg.attachmentUrl}
                      alt="Shared photo"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "220px",
                        objectFit: "cover",
                        display: "block",
                        borderRadius: "2px",
                        border: "1px solid rgba(0,0,0,0.1)",
                        transition: "opacity 0.2s ease, transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.92";
                        e.currentTarget.style.transform = "scale(1.01)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    />
                  </div>
                )}
                {msg.text && <div>{msg.text}</div>}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  marginTop: "3px",
                  textAlign: isUser ? "right" : "left",
                }}
              >
                {formatRelativeTime(msg.timestamp)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            background: "none",
            border: "none",
            color: isUploading ? "var(--accent)" : "var(--text-secondary)",
            cursor: isUploading ? "wait" : "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
          }}
          title={isUploading ? "Uploading photo..." : "Attach Photo"}
        >
          <Camera size={18} />
        </button>

        <input
          type="text"
          placeholder={isUploading ? "Uploading attached photo..." : "Message (e.g., Gate code, location landmark)..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isUploading}
          style={{
            flex: 1,
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "0px",
            padding: "10px 14px",
            fontSize: "13px",
            color: "var(--text-primary)",
            outline: "none",
            fontFamily: "inherit",
          }}
        />

        <button
          type="submit"
          disabled={isUploading}
          style={{
            padding: "10px 18px",
            backgroundColor: "var(--accent)",
            color: "var(--accent-text)",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>{isUploading ? "..." : "Send"}</span>
          <Send size={14} />
        </button>
      </form>

      {/* Compact In-App Photo Popup Modal */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          {/* Centered Compact Card Box */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              border: isDark ? "1.5px solid var(--accent)" : "1.5px solid #0891b2",
              boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "0px",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                Shared Photo Attachment
              </div>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Photo Container */}
            <div
              style={{
                padding: "16px",
                backgroundColor: isDark ? "#080c14" : "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={previewPhotoUrl}
                alt="Shared photo"
                style={{
                  maxWidth: "100%",
                  maxHeight: "360px",
                  objectFit: "contain",
                  display: "block",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid var(--border)",
                backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                style={{
                  padding: "8px 18px",
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <X size={15} />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
