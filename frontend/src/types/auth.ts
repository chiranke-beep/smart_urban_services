export type UserRole = "HOMEOWNER" | "PROVIDER" | "ADMIN";

export interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  role: UserRole;
  locality: string;
  district: string;
  avatarUrl?: string;
  createdAt: string;

  // Specific to SERVICE PROVIDER
  trade?: string;
  tradeType?: "painting" | "plumbing" | "trees" | "cleaning" | "tech" | "odd_jobs";
  nicNumber?: string;
  experienceYears?: number;
  dailyRate?: number;
  hourlyRate?: number;
  verifiedBadge?: boolean;
  vehicleType?: string;
  plateNumber?: string;
  status?: "AVAILABLE" | "BUSY" | "OFFLINE";

  // Specific to ADMIN
  staffId?: string;
  department?: string;
  accessLevel?: "SUPER_ADMIN" | "DISTRICT_MANAGER" | "SUPPORT_STAFF";
}

export interface LoginCredentials {
  identifier: string; // phone or email or staff ID
  password?: string;
  otp?: string;
  role: UserRole;
}

export interface HomeownerRegistrationData {
  fullName: string;
  phone: string;
  email?: string;
  locality: string;
  district: string;
  password?: string;
}

export interface ProviderRegistrationData {
  fullName: string;
  phone: string;
  hasWhatsApp: boolean;
  email?: string;
  locality: string;
  district: string;
  trade: string;
  tradeType: "painting" | "plumbing" | "trees" | "cleaning" | "tech" | "odd_jobs";
  skills: string[];
  experienceYears: number;
  nicNumber: string;
  nvqCertificateName?: string;
  vehicleType?: string;
  plateNumber?: string;
  dailyRate: number;
  hourlyRate: number;
  payoutMethod: "CASH_ON_HAND" | "BANK_TRANSFER";
  bankName?: string;
  accountNumber?: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  expiresAt: string;
}
