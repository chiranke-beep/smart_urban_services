import { ChatMessage } from "@/types/chat";

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  "JOB-7821": [
    {
      id: "M-1",
      jobId: "JOB-7821",
      sender: "system",
      senderName: "Smart Urban Dispatch",
      text: "Sunil Kumara accepted your request. Real-time encrypted channel active.",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: "M-2",
      jobId: "JOB-7821",
      sender: "worker",
      senderName: "Sunil Kumara",
      text: "Ayubowan! I reviewed your tree hazard photo. The branch is leaning close to the Ceylon Electricity line. I have a long telescoping chainsaw and ropes.",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: "M-3",
      jobId: "JOB-7821",
      sender: "worker",
      senderName: "Sunil Kumara",
      text: "Official Quote: Rs. 3,500 for full cut and compound clearance.",
      attachmentType: "quote",
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: "M-4",
      jobId: "JOB-7821",
      sender: "user",
      senderName: "Homeowner",
      text: "Agreed! Quote accepted. Please be careful around the fiber internet line on the boundary.",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: "M-5",
      jobId: "JOB-7821",
      sender: "worker",
      senderName: "Sunil Kumara",
      text: "Understood! I've loaded my gear into my three-wheeler (WP-ABX-8821). Travelling via High Level Road. ETA 14 minutes!",
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      read: false,
    },
  ],
};

const STORAGE_KEY = "sus_chat_sessions_v1";

export const chatService = {
  getMessages(jobId: string): ChatMessage[] {
    if (typeof window === "undefined") return INITIAL_MESSAGES[jobId] || [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES[jobId] || [];
    }
    try {
      const data = JSON.parse(stored);
      return data[jobId] || [];
    } catch {
      return INITIAL_MESSAGES[jobId] || [];
    }
  },

  sendMessage(jobId: string, text: string, sender: "user" | "worker" = "user"): ChatMessage {
    const all = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)
      ? JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      : INITIAL_MESSAGES;

    const newMsg: ChatMessage = {
      id: `M-${Date.now()}`,
      jobId,
      sender,
      senderName: sender === "user" ? "You" : "Technician",
      text,
      timestamp: new Date().toISOString(),
      read: true,
    };

    const updatedList = [...(all[jobId] || []), newMsg];
    all[jobId] = updatedList;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
    return newMsg;
  },
};
