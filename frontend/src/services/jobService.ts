import { JobRequest } from "@/types/job";
import { UserProfile } from "@/types/auth";
import { apiClient } from "./api";
import { socketService } from "./socketService";
import { chatService } from "./chatService";
import { formatCurrency } from "@/utils/formatters";

const STORAGE_KEY = "sus_live_db_jobs_v6";

export const jobService = {
  getJobs(): JobRequest[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  async fetchRemoteJobs(): Promise<JobRequest[]> {
    try {
      const res = await apiClient<{ success: boolean; data?: any[] }>("/incidents");
      if (res?.data && Array.isArray(res.data)) {
        const categoryReverseMap: Record<string, string> = {
          waste: "tree-cutting",
          water: "plumbing",
          electricity: "pc-repair",
          road: "odd_jobs",
        };

        const stageMap: Record<string, JobRequest["stage"]> = {
          pending: "REQUESTED",
          assigned: "EN_ROUTE",
          in_progress: "IN_PROGRESS",
          resolved: "COMPLETED",
          rejected: "CANCELLED",
        };

        // Merge remote DB data with local state (preserve updated prices, quotations, etc.)
        const localJobs = this.getJobs();
        const localById: Record<string, JobRequest> = {};
        localJobs.forEach((j) => { localById[j.id] = j; });

        const mapped: JobRequest[] = res.data.map((inc: any) => {
          const jobId = `JOB-${inc.id}`;
          const localJob = localById[jobId];

          const dbStage = (inc.stage as JobRequest["stage"]) || stageMap[inc.status] || "REQUESTED";
          const finalStage: JobRequest["stage"] = (() => {
            if (inc.status === "resolved") return "COMPLETED";
            if (inc.status === "rejected") return "CANCELLED";
            if (inc.stage && inc.stage !== "REQUESTED") return inc.stage as JobRequest["stage"];
            if (localJob?.stage && localJob.stage !== "REQUESTED") return localJob.stage;
            return dbStage;
          })();

          const dbCost = inc.cost_lkr ? Number(inc.cost_lkr) : undefined;
          const finalCost = (localJob?.quotation?.amountLKR && finalStage === "QUOTED") ? localJob.quotation.amountLKR : (dbCost || localJob?.costLKR || 3500);
          const hasQuote = finalStage !== "REQUESTED" && Boolean(dbCost || localJob?.quotation || inc.quotation_notes || finalStage === "QUOTED");
          const finalQuotation = hasQuote
            ? {
                id: localJob?.quotation?.id || `Q-${inc.id}`,
                workerId: inc.assigned_to ? `W-${inc.assigned_to}` : (localJob?.quotation?.workerId || "w-1"),
                workerName: inc.assignee_name || localJob?.quotation?.workerName || "Verified Technician",
                avatarBg: "#10b981",
                amountLKR: finalCost,
                rateType: "fixed" as const,
                notes: inc.quotation_notes || localJob?.quotation?.notes || "Official Specialist Quotation",
                submittedAt: inc.updated_at || new Date().toISOString(),
                status: (finalStage === "EN_ROUTE" || finalStage === "IN_PROGRESS" || finalStage === "COMPLETED") ? ("accepted" as const) : ("pending" as const),
              }
            : undefined;

          return {
            id: jobId,
            title: inc.title,
            category: (categoryReverseMap[inc.category] || inc.category || "odd_jobs") as any,
            description: inc.description,
            locality: inc.location_text?.split(",")?.[0]?.trim() || "Heerassagala",
            district: inc.location_text?.split(",")?.[1]?.trim() || "Kandy",
            urgency: inc.priority === "critical" ? "emergency" : inc.priority === "high" ? "today" : "flexible",
            createdAt: inc.created_at || new Date().toISOString(),
            stage: finalStage,
            stageUpdatedAt: inc.updated_at || inc.created_at || new Date().toISOString(),
            costLKR: hasQuote ? finalCost : undefined,
            paymentMethod: "Cash on Hand",
            // Map real GPS coordinates from DB (if saved during job creation)
            latitude: inc.latitude ? Number(inc.latitude) : (localJob?.latitude || 7.264242),
            longitude: inc.longitude ? Number(inc.longitude) : (localJob?.longitude || 80.621701),
            quotation: finalQuotation,
            assignedWorker: (finalStage !== "REQUESTED" && inc.assignee_name)
              ? {
                  id: `W-${inc.assigned_to}`,
                  name: inc.assignee_name,
                  trade: "Verified Specialist",
                  rating: 5.0,
                  reviewCount: 1,
                  phone: "+94 77 123 4567",
                  avatarBg: "#10b981",
                  verified: true,
                }
              : (finalStage !== "REQUESTED" ? localJob?.assignedWorker : undefined),
            ratingGiven: inc.rating || localJob?.ratingGiven,
            reviewGiven: inc.review_comment || localJob?.reviewGiven,
          };
        });

        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch (err: any) {
      console.warn("[Remote Incident fetch notice]:", err.message);
    }
    return this.getJobs();
  },

  async createJob(jobData: Omit<JobRequest, "id" | "createdAt" | "stage" | "stageUpdatedAt">): Promise<JobRequest> {
    const jobs = this.getJobs();
    let generatedId = `JOB-${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      const res = await apiClient<{ success: boolean; data?: { id: number } }>("/incidents", {
        method: "POST",
        body: JSON.stringify({
          title: jobData.title,
          description: jobData.description,
          category: jobData.category || "other",
          priority: jobData.urgency === "emergency" ? "critical" : jobData.urgency === "today" ? "medium" : "low",
          location_text: `${jobData.locality}, ${jobData.district}`,
          latitude: jobData.latitude,
          longitude: jobData.longitude,
        }),
      });

      if (res?.data?.id) {
        generatedId = `JOB-${res.data.id}`;
      }
    } catch (err: any) {
      console.warn("[PostgreSQL Incident sync notice]:", err.message);
    }

    const newJob: JobRequest = {
      ...jobData,
      id: generatedId,
      createdAt: new Date().toISOString(),
      stage: "REQUESTED",
      stageUpdatedAt: new Date().toISOString(),
      etaMinutes: 20,
      paymentMethod: "Cash on Hand",
    };

    const updated = [newJob, ...jobs.filter((j) => j.id !== newJob.id)];
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    // Broadcast in real-time over WebSocket so connected service providers receive it immediately
    socketService.dispatchJob(newJob);

    return newJob;
  },

  acceptJob(jobId: string, provider: UserProfile, quoteLKR: number = 3500): JobRequest | null {
    const jobs = this.getJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return null;

    // SP accepts and quotes → set QUOTED so citizen must accept the price before dispatch
    job.stage = "QUOTED";
    job.stageUpdatedAt = new Date().toISOString();
    job.costLKR = quoteLKR;
    job.assignedWorker = {
      id: provider.id,
      name: provider.fullName,
      trade: provider.trade || "Verified Technician",
      rating: 5.0,
      reviewCount: 1,
      phone: provider.phone,
      avatarBg: "#10b981",
      verified: true,
      vehicleType: provider.vehicleType || "Service Vehicle",
      plateNumber: provider.plateNumber || "WP-ABX-8821",
    };
    job.quotation = {
      id: `Q-${Date.now().toString().slice(-4)}`,
      workerId: provider.id,
      workerName: provider.fullName,
      avatarBg: "#10b981",
      amountLKR: quoteLKR,
      rateType: "fixed",
      notes: "Specialist quoted price. Awaiting citizen confirmation.",
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }

    // Broadcast QUOTED stage — citizen must accept before EN_ROUTE
    socketService.updateStage(jobId, "QUOTED");
    socketService.updateQuotation(jobId, quoteLKR, provider.fullName);

    // Sync assigned_to and cost_lkr/stage to PostgreSQL
    const rawId = jobId.replace("JOB-", "");
    const providerNumericId = Number(provider.id.replace(/\D/g, "")) || 3;
    if (/^\d+$/.test(rawId)) {
      apiClient(`/incidents/${rawId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "assigned",
          assigned_to: providerNumericId,
          cost_lkr: quoteLKR,
          stage: "QUOTED",
          quotation_notes: "Specialist submitted official quotation.",
        }),
      }).catch((err) => {
        console.warn("[Incident Assign sync notice]:", err.message);
      });
    }

    return job;
  },

  advanceStage(jobId: string, nextStage: JobRequest["stage"]): JobRequest | null {
    const jobs = this.getJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return null;

    job.stage = nextStage;
    job.stageUpdatedAt = new Date().toISOString();

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }

    // Broadcast status change across WebSockets
    socketService.updateStage(jobId, nextStage);

    // Async sync status to backend if numeric ID
    const rawId = jobId.replace("JOB-", "");
    if (/^\d+$/.test(rawId)) {
      const statusMap: Record<string, string> = {
        REQUESTED: "pending",
        QUOTED: "assigned",
        EN_ROUTE: "assigned",
        IN_PROGRESS: "in_progress",
        COMPLETED: "resolved",
        CANCELLED: "rejected",
      };

      apiClient(`/incidents/${rawId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: statusMap[nextStage] || "pending",
          stage: nextStage,
        }),
      }).catch((err) => {
        console.warn("[Incident Status sync notice]:", err.message);
      });

      if (nextStage === "COMPLETED") {
        apiClient("/payments", {
          method: "POST",
          body: JSON.stringify({
            jobId,
            amountLKR: job.costLKR || 3500,
            paymentMethod: job.paymentMethod || "Cash on Hand",
          }),
        }).catch((err) => console.warn("[Payment DB record notice]:", err.message));
      }
    }

    return job;
  },

  cancelJob(jobId: string): JobRequest | null {
    const jobs = this.getJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return null;

    job.stage = "CANCELLED";
    job.stageUpdatedAt = new Date().toISOString();

    const remaining = jobs.filter((j) => j.id !== jobId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    }

    socketService.updateStage(jobId, "CANCELLED");

    const rawId = jobId.replace("JOB-", "");
    if (/^\d+$/.test(rawId)) {
      apiClient(`/incidents/${rawId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "rejected",
          stage: "CANCELLED",
        }),
      }).catch((err) => console.warn("[Cancel incident notice]:", err.message));
    }

    return job;
  },

  updateQuotation(jobId: string, newAmountLKR: number, workerName?: string): JobRequest | null {
    const jobs = this.getJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return null;

    job.costLKR = newAmountLKR;
    if (job.quotation) {
      job.quotation.amountLKR = newAmountLKR;
      job.quotation.submittedAt = new Date().toISOString();
      job.quotation.status = "pending";
    } else {
      job.quotation = {
        id: `quote-${Date.now()}`,
        workerId: "w-1",
        workerName: workerName || "Technician",
        avatarBg: "var(--accent)",
        amountLKR: newAmountLKR,
        rateType: "fixed",
        notes: "Direct agreed quotation",
        submittedAt: new Date().toISOString(),
        status: "pending",
      };
    }
    job.stage = "QUOTED";
    job.stageUpdatedAt = new Date().toISOString();

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }

    socketService.updateQuotation(jobId, newAmountLKR, workerName);
    socketService.updateStage(jobId, "QUOTED");

    // Sync price & stage to DB
    const rawId = jobId.replace("JOB-", "");
    if (/^\d+$/.test(rawId)) {
      apiClient(`/incidents/${rawId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "assigned",
          cost_lkr: newAmountLKR,
          stage: "QUOTED",
          quotation_notes: "Specialist updated quotation.",
        }),
      }).catch((err) => console.warn("[Quotation DB sync]:", err.message));
    }

    chatService.sendMessage(
      jobId,
      `🏷️ Official Quotation Updated: Proposed final fee is ${formatCurrency(newAmountLKR)}. Please review and accept to start live dispatch.`,
      "worker",
      workerName || "Specialist Dispatch"
    );

    return job;
  },

  acceptQuote(jobId: string): JobRequest | null {
    const jobs = this.getJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return null;

    job.stage = "EN_ROUTE";
    job.stageUpdatedAt = new Date().toISOString();
    if (job.quotation) {
      job.quotation.status = "accepted";
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }

    socketService.updateStage(jobId, "EN_ROUTE");

    // Sync to PostgreSQL
    const rawId = jobId.replace("JOB-", "");
    if (/^\d+$/.test(rawId)) {
      apiClient(`/incidents/${rawId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "assigned",
          stage: "EN_ROUTE",
        }),
      }).catch((err) => console.warn("[Accept Quote DB sync]:", err.message));
    }

    // Send a confirmation message in chat
    chatService.sendMessage(
      jobId,
      `✅ Price accepted! Specialist is now en route to your location.`,
      "user",
      "Homeowner"
    );

    return job;
  },

  submitReview(jobId: string, rating: number, review: string): JobRequest | null {
    const jobs = this.getJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return null;

    job.ratingGiven = rating;
    job.reviewGiven = review;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }

    // Persist review to PostgreSQL database
    const rawId = jobId.replace("JOB-", "");
    apiClient("/reviews", {
      method: "POST",
      body: JSON.stringify({
        jobId,
        rating,
        comment: review,
      }),
    }).catch((err) => console.warn("[Review DB sync notice]:", err.message));

    return job;
  },
};
