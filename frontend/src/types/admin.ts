export interface PendingWorkerApplication {
  id: string;
  fullName: string;
  nicNumber: string;
  trade: string;
  category: string;
  district: string;
  locality: string;
  experienceYears: number;
  phone: string;
  nicFrontUrl?: string;
  skillCertUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  rejectionReason?: string;
}

export interface DistrictMetric {
  district: string;
  province: string;
  activeJobs: number;
  verifiedWorkers: number;
  totalSettledLKR: number;
  avgResponseMins: number;
  serviceCompletionRate: number;
}
