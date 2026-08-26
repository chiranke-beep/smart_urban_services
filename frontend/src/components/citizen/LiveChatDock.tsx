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
import { formatCurrency, formatRelativeTime } from "@/utils/formatters";
import { useTheme } from "@/components/ThemeProvider";

interface LiveChatDockProps {
  job: JobRequest;
  onClose: () => void;
}

export function LiveChatDock({ job, onClose }: LiveChatDockProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const worker = job.assignedWorker;

  useEffect(() => {
    setMessages(chatService.getMessages(job.id));
  }, [job.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = chatService.sendMessage(job.id, input, "user");
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate natural worker reply based on job stage and trade
    setTimeout(() => {
      let replyText = "Ayubowan! Got your message. I am on my way to your address now, will be there shortly!";
      
      if (job.stage === "EN_ROUTE") {
        const enRouteReplies = [
          "Ayubowan! Got your message. I have loaded all my tools and I'm heading towards your location now!",
          "Got it! Just passing the main junction. See you in a few minutes at your gate.",
          "Understood! Travelling via the main road now, will reach your address very shortly.",
        ];
        replyText = enRouteReplies[Math.floor(Math.random() * enRouteReplies.length)];
      } else if (job.stage === "IN_PROGRESS") {
        const inProgressReplies = [
          "Yes! I am working on the task right now. Everything is going smoothly.",
          "Understood! Making good progress on the work. Will let you know as soon as it is finished.",
        ];
        replyText = inProgressReplies[Math.floor(Math.random() * inProgressReplies.length)];
      } else if (job.stage === "COMPLETED") {
        replyText = "Thank you very much! Glad I could complete the work for you today. Please leave a rating if you're satisfied!";
      } else {
        replyText = "Ayubowan! I received your request and I'm checking the details now. Let me know if you have any questions!";
      }

      const workerReply = chatService.sendMessage(job.id, replyText, "worker");
      setMessages((prev) => [...prev, workerReply]);
    }, 1000);
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
          {worker && (
            <div
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: worker.avatarBg,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "14px",
              }}
            >
              {worker.name.split(" ").map((n) => n[0]).join("")}
            </div>
          )}
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>
              {worker?.name || "Technician"}
            </div>
            <div style={{ fontSize: "11px", opacity: 0.85, display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981" }} />
              <span>Active on Job #{job.id} · {job.locality}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {worker && (
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

      {/* Quote Pin Banner if available */}
      {job.quotation && (
        <div
          style={{
            padding: "10px 16px",
            backgroundColor: "rgba(16,185,129,0.12)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
          }}
        >
          <span style={{ color: "#10b981", fontWeight: 700 }}>
            ✓ Verified Rate: {formatCurrency(job.quotation.amountLKR)} ({job.quotation.rateType})
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            Zero Middleman Fees
          </span>
        </div>
      )}

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
