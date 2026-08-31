import { io, Socket } from "socket.io-client";

const getSocketUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    // On HTTPS (production via Nginx), use same origin — Nginx proxies /socket.io/
    if (protocol === "https:") {
      return `https://${hostname}`;
    }
    if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
    return `${protocol}//${hostname}:5000`;
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
};

class SocketService {
  private socket: Socket | null = null;

  public getSocket(): Socket {
    if (!this.socket) {
      const socketUrl = getSocketUrl();
      this.socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        console.log("🟢 Connected to SUS WebSocket Gateway:", this.socket?.id);
      });

      this.socket.on("disconnect", () => {
        console.log("🔴 Disconnected from SUS WebSocket Gateway");
      });
    }

    return this.socket;
  }

  public joinJob(jobId: string) {
    const s = this.getSocket();
    s.emit("join_job", jobId);
  }

  public sendMessage(message: any) {
    const s = this.getSocket();
    s.emit("send_message", message);
  }

  public dispatchJob(jobData: any) {
    const s = this.getSocket();
    s.emit("dispatch_job", jobData);
  }

  public updateStage(jobId: string, stage: string) {
    const s = this.getSocket();
    s.emit("update_stage", { jobId, stage, timestamp: new Date().toISOString() });
  }

  public emitGpsMove(gpsData: { workerId?: string; lat: number; lng: number; speed?: number; stage?: string; timestamp?: string }) {
    const s = this.getSocket();
    s.emit("worker_gps_move", gpsData);
  }

  public onNewMessage(callback: (msg: any) => void) {
    const s = this.getSocket();
    s.on("new_message", callback);
    return () => {
      s.off("new_message", callback);
    };
  }

  public onIncomingJob(callback: (job: any) => void) {
    const s = this.getSocket();
    s.on("incoming_job_broadcast", callback);
    return () => {
      s.off("incoming_job_broadcast", callback);
    };
  }

  public onStageChanged(callback: (data: { jobId: string; stage: string }) => void) {
    const s = this.getSocket();
    s.on("job_stage_changed", callback);
    return () => {
      s.off("job_stage_changed", callback);
    };
  }

  public updateQuotation(jobId: string, amountLKR: number, workerName?: string, notes?: string, workerId?: string) {
    const s = this.getSocket();
    s.emit("update_quotation", { jobId, amountLKR, workerName, notes, workerId, timestamp: new Date().toISOString() });
  }

  public onQuotationUpdated(callback: (data: { jobId: string; amountLKR: number; workerName?: string; notes?: string; workerId?: string; providerId?: string }) => void) {
    const s = this.getSocket();
    s.on("quotation_updated", callback);
    return () => {
      s.off("quotation_updated", callback);
    };
  }

  public onGpsTelemetry(callback: (gps: any) => void) {
    const s = this.getSocket();
    s.on("gps_telemetry_stream", callback);
    return () => {
      s.off("gps_telemetry_stream", callback);
    };
  }

  public onWorkerVerificationUpdated(callback: (data: { userId: string; verified: boolean; status: string; rejectionReason?: string }) => void) {
    const s = this.getSocket();
    s.on("worker_verification_updated", callback);
    return () => {
      s.off("worker_verification_updated", callback);
    };
  }
}

export const socketService = new SocketService();
