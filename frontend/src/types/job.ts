export type JobCategory =
  | "painting"
  | "tree-cutting"
  | "plumbing"
  | "cleaning"
  | "pc-repair"
  | "odd-jobs";

export type JobUrgency = "emergency" | "today" | "flexible";

export type PaymentMethod = "Cash on Hand" | "Bank Transfer" | "Pending Handover";

export type DispatchStage =
  | "REQUESTED"
  | "MATCHED"
  | "QUOTED"
  | "EN_ROUTE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface Quotation {
  id: string;
  workerId: string;
  workerName: string;
  avatarBg: string;
  amountLKR: number;
  rateType: "fixed" | "daily" | "per_unit";
  notes: string;
  submittedAt: string;
  status: "pending" | "accepted" | "declined";
}

export interface JobRequest {
  id: string;
  title: string;
  category: JobCategory;
  description: string;
  locality: string;
  district: string;
  address?: string;
  urgency: JobUrgency;
  photos?: string[];
  createdAt: string;
  stage: DispatchStage;
  stageUpdatedAt: string;
  etaMinutes?: number;
  assignedWorker?: {
    id: string;
    name: string;
    trade: string;
    rating: number;
    reviewCount: number;
    phone: string;
    avatarBg: string;
    verified: boolean;
    vehicleType?: string;
    plateNumber?: string;
  };
  quotation?: Quotation;
  costLKR?: number;
  paymentMethod?: PaymentMethod;
  ratingGiven?: number;
  reviewGiven?: string;
}
