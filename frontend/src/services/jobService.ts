import { JobRequest } from "@/types/job";

const INITIAL_JOBS: JobRequest[] = [
  {
    id: "JOB-7821",
    title: "Pre-Monsoon Tree Branch Trimming & Yard Clean",
    category: "tree-cutting",
    description: "Overhanging coconut tree branches near power lines. Need safe chain-saw cutting and branch haul-away.",
    locality: "Maharagama",
    district: "Colombo",
    address: "No. 42, Temple Road, Maharagama",
    urgency: "today",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    stage: "EN_ROUTE",
    stageUpdatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    etaMinutes: 14,
    assignedWorker: {
      id: "W-401",
      name: "Sunil Kumara",
      trade: "Master Tree Climber & Yard Care",
      rating: 4.9,
      reviewCount: 142,
      phone: "+94 77 123 4567",
      avatarBg: "#10b981",
      verified: true,
      vehicleType: "Three Wheeler & Chainsaw Gear",
      plateNumber: "WP-ABX-8821",
    },
    quotation: {
      id: "Q-902",
      workerId: "W-401",
      workerName: "Sunil Kumara",
      avatarBg: "#10b981",
      amountLKR: 3500,
      rateType: "fixed",
      notes: "Includes cutting of 2 high branches + safe clearance from roof wires.",
      submittedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      status: "accepted",
    },
    costLKR: 3500,
    paymentMethod: "Cash on Hand",
  },
  {
    id: "JOB-6419",
    title: "Bathroom Overhead PVC Pipe Leak & Valve Repair",
    category: "plumbing",
    description: "Cold water inlet joint cracked. Water dripping down into the first floor ceiling.",
    locality: "Kelaniya",
    district: "Gampaha",
    urgency: "emergency",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    stage: "COMPLETED",
    stageUpdatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    assignedWorker: {
      id: "W-209",
      name: "Rohan Jayasuriya",
      trade: "Master Plumber & Pipe Specialist",
      rating: 4.9,
      reviewCount: 204,
      phone: "+94 71 987 6543",
      avatarBg: "#06b6d4",
      verified: true,
    },
    costLKR: 2800,
    paymentMethod: "Cash on Hand",
    ratingGiven: 5,
    reviewGiven: "Arrived within 30 mins in Kelaniya during the night leak. Replaced the ball valve fast and accepted cash upon completion.",
  },
  {
    id: "JOB-5102",
    title: "Windows Blue-Screen Crash & Thermal Paste Replacement",
    category: "pc-repair",
    description: "Gaming PC overheating and crashing every 15 minutes with blue-screen error.",
    locality: "Nugegoda",
    district: "Colombo",
    urgency: "flexible",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    stage: "COMPLETED",
    stageUpdatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedWorker: {
      id: "W-550",
      name: "Dinesh Weerasinghe",
      trade: "Hardware & Network Tech",
      rating: 4.9,
      reviewCount: 168,
      phone: "+94 76 555 1234",
      avatarBg: "#a855f7",
      verified: true,
    },
    costLKR: 3200,
    paymentMethod: "Bank Transfer",
    ratingGiven: 5,
    reviewGiven: "Fixed the motherboard thermal paste issue and cleaned the fans. Paid via Bank Transfer directly.",
  },
];

const STORAGE_KEY = "sus_homeowner_jobs_v3";

export const jobService = {
  getJobs(): JobRequest[] {
    if (typeof window === "undefined") return INITIAL_JOBS;
    try {
      localStorage.removeItem("sus_homeowner_jobs_v1");
      localStorage.removeItem("sus_homeowner_jobs_v2");
    } catch (_) {}

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_JOBS));
      return INITIAL_JOBS;
    }
    try {
      const parsed: JobRequest[] = JSON.parse(stored);
      const sanitized = parsed.map((j) => ({
        ...j,
        paymentMethod:
          (j.paymentMethod as any) === "LankaQR / Transfer"
            ? ("Bank Transfer" as const)
            : j.paymentMethod || ("Cash on Hand" as const),
        reviewGiven: j.reviewGiven
          ? j.reviewGiven.replace(/LankaQR/gi, "Bank Transfer")
          : j.reviewGiven,
      }));
      return sanitized;
    } catch {
      return INITIAL_JOBS;
    }
  },

  createJob(jobData: Omit<JobRequest, "id" | "createdAt" | "stage" | "stageUpdatedAt">): JobRequest {
    const jobs = this.getJobs();
    const newJob: JobRequest = {
      ...jobData,
      id: `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      stage: "REQUESTED",
      stageUpdatedAt: new Date().toISOString(),
      etaMinutes: 25,
      paymentMethod: "Cash on Hand",
    };

    const updated = [newJob, ...jobs];
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return newJob;
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
    return job;
  },
};
