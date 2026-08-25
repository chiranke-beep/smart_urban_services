export interface ChatMessage {
  id: string;
  jobId: string;
  sender: "user" | "worker" | "system";
  senderName: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "quote" | "location";
  timestamp: string;
  read: boolean;
}

export interface ChatSession {
  jobId: string;
  workerId: string;
  workerName: string;
  avatarBg: string;
  trade: string;
  online: boolean;
  messages: ChatMessage[];
  unreadCount: number;
}
