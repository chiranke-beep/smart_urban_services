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
  vehicleType?: string;
  plateNumber?: string;
  nicFrontUrl?: string;
  skillCertUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  rejectionReason?: string;
}

export interface CivicHazardIncident {
  id: string;
  title: string;
  category: string;
  district: string;
  locality: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM";
  reportedBy: string;
  reportedAt: string;
  status: "OPEN" | "DISPATCHED" | "RESOLVED";
  assignedCrew?: string;
  description: string;
}

export interface DistrictMetric {
  district: string;
  province: string;
  activeJobs: number;
  verifiedWorkers: number;
  totalSettledLKR: number;
  avgResponseMins: number;
  hazardResolutionRate: number;
}
