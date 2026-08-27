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

interface LiveChatDockProps {
  job: JobRequest;
  onClose: () => void;
}

export function LiveChatDock({ job, onClose }: LiveChatDockProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentQuotePrice, setCurrentQuotePrice] = useState<number>(job.quotation?.amountLKR || job.costLKR || 3500);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const worker = job.assignedWorker;

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
        setMessages(msgs);
      });
    }, 5000);

    return () => {
      unsubscribe();
      unsubQuote();
      clearInterval(pollInterval);
    };
  }, [job.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "640px",
        borderRadius: "0px",
        backgroundColor: "var(--card-bg)",
        border: "1.5px solid var(--accent)",
        boxShadow: "0 20px 48px -12px rgba(0,0,0,0.4)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        overflow: "hidden",
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: "16px 20px",
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "var(--accent)",
          color: isDark ? "#ffffff" : "var(--accent-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: worker?.avatarBg || "var(--accent)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "14px",
            }}
          >
            {worker?.name ? worker.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "SP"}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>
              {worker?.name || "Service Provider Dispatch"}
            </div>
            <div style={{ fontSize: "11px", opacity: 0.85, display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981", borderRadius: "50%" }} />
              <span>
                {worker
                  ? `Active on Job #${job.id} · ${job.locality}`
                  : `Awaiting Dispatch Acceptance · ${job.locality}`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {worker?.phone && (
            <a
              href={`tel:${worker.phone}`}
              style={{
                color: "inherit",
                padding: "6px",
                display: "flex",
                alignItems: "center",
              }}
              title="Call Worker"
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
          <span style={{ color: "#10b981", fontWeight: 800 }}>
            🏷️ Price: {formatCurrency(currentQuotePrice)}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            {job.stage === "QUOTED"
              ? "Price sent (Waiting for your approval)"
              : job.stage === "EN_ROUTE"
              ? "Accepted · Worker on the way"
              : job.stage === "IN_PROGRESS"
              ? "Worker is working"
              : job.stage === "COMPLETED"
              ? "Finished & Paid"
              : "Waiting for worker price"}
          </span>
        </div>

        {job.stage === "QUOTED" && job.quotation && user?.role !== "PROVIDER" && (
          <button
            onClick={() => {
              jobService.acceptQuote(job.id);
              socketService.updateStage(job.id, "EN_ROUTE");
            }}
            style={{
              padding: "5px 12px",
              backgroundColor: "#10b981",
              color: "#ffffff",
              border: "none",
              fontWeight: 800,
              fontSize: "11.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
            }}
          >
            <CheckCircle size={13} />
            <span>Accept Price & Start</span>
          </button>
        )}
      </div>

      {/* Chat Messages Scroll Feed */}
      <div
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
          const isUser = msg.sender === "user";
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
                  padding: "10px 14px",
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
                {msg.text}
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
        <div ref={messagesEndRef} />
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
        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "4px",
          }}
          title="Attach Photo"
        >
          <Camera size={18} />
        </button>

        <input
          type="text"
          placeholder="Message worker (e.g., Gate code, location landmark)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
          <span>Send</span>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
