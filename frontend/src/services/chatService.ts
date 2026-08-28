import { ChatMessage } from "@/types/chat";
import { apiClient } from "./api";
import { socketService } from "./socketService";

const STORAGE_KEY = "sus_live_db_chat_v4";

export const chatService = {
  getMessages(jobId: string): ChatMessage[] {
    if (typeof window === "undefined" || !jobId) return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      const data = JSON.parse(stored);
      return data[jobId] || [];
    } catch {
      return [];
    }
  },

  async fetchMessages(jobId: string): Promise<ChatMessage[]> {
    if (!jobId) return [];
    try {
      const res = await apiClient<{ success: boolean; data?: any[] }>(`/chat/${jobId}`);
      if (res?.success && Array.isArray(res.data)) {
        const mapped: ChatMessage[] = res.data.map((r) => ({
          id: r.id,
          jobId: r.jobId || r.job_id || jobId,
          sender: r.sender,
          senderName: r.senderName || r.sender_name || (r.sender === "user" ? "Homeowner" : "Technician"),
          text: r.text || "",
          attachmentUrl: r.photoUrl || r.photo_url || r.attachmentUrl,
          attachmentType: (r.photoUrl || r.photo_url || r.attachmentUrl) ? "image" : undefined,
          timestamp: r.timestamp || r.created_at || new Date().toISOString(),
          read: true,
        }));
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(STORAGE_KEY);
          const all = stored ? JSON.parse(stored) : {};
          all[jobId] = mapped;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        }
        return mapped;
      }
    } catch (err: any) {
      console.warn("[Fetch chat API error]:", err.message);
    }
    return this.getMessages(jobId);
  },

  sendMessage(
    jobId: string,
    text: string,
    sender: "user" | "worker" = "user",
    senderName?: string,
    attachmentUrl?: string
  ): ChatMessage {
    const sName = senderName || (sender === "user" ? "Homeowner" : "Technician");
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const all = stored ? JSON.parse(stored) : {};

    const newMsg: ChatMessage = {
      id: `M-${Date.now()}`,
      jobId,
      sender,
      senderName: sName,
      text,
      attachmentUrl,
      attachmentType: attachmentUrl ? "image" : undefined,
      timestamp: new Date().toISOString(),
      read: true,
    };

    const updatedList = [...(all[jobId] || []), newMsg];
    all[jobId] = updatedList;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }

    // 1. Sync over WebSocket in real time
    socketService.sendMessage(newMsg);

    // 2. Persist to PostgreSQL database (lightweight static URL)
    apiClient(`/chat/${jobId}`, {
      method: "POST",
      body: JSON.stringify({
        sender,
        senderName: sName,
        text,
        photoUrl: attachmentUrl || null,
      }),
    }).catch((err) => {
      console.warn("[Chat DB persist]:", err.message);
    });

    return newMsg;
  },

  receiveExternalMessage(newMsg: ChatMessage) {
    if (typeof window === "undefined" || !newMsg.jobId) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : {};
    const existingList = all[newMsg.jobId] || [];

    if (!existingList.some((m: ChatMessage) => m.id === newMsg.id)) {
      all[newMsg.jobId] = [...existingList, newMsg];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  },
};
