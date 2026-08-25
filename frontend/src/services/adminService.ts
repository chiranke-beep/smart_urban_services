import {
  PendingWorkerApplication,
  CivicHazardIncident,
  DistrictMetric,
} from "@/types/admin";

const INITIAL_APPLICATIONS: PendingWorkerApplication[] = [
  {
    id: "APP-1092",
    fullName: "Sunil Kumara",
    nicNumber: "198824109281",
    trade: "Master Tree Climber & Yard Care",
    category: "tree-cutting",
    district: "Colombo",
    locality: "Maharagama",
    experienceYears: 12,
    phone: "+94 77 123 4567",
    vehicleType: "Three Wheeler & Chainsaw Rig",
    plateNumber: "WP-ABX-8821",
    nicFrontUrl: "national_id_front.jpg",
    skillCertUrl: "vocational_arborist_cert.jpg",
    status: "APPROVED",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "APP-2041",
    fullName: "Kasun Anuradha",
    nicNumber: "199411802931",
    trade: "Licensed Electrician & Solar Tech",
    category: "odd-jobs",
    district: "Gampaha",
    locality: "Kelaniya",
    experienceYears: 7,
    phone: "+94 71 888 4421",
    vehicleType: "Motorcycle (Tool Box)",
    plateNumber: "WP-BBI-4402",
    nicFrontUrl: "nic_scan_kasun.jpg",
    skillCertUrl: "nvq_level_4_electrician.jpg",
    status: "PENDING",
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "APP-3088",
    fullName: "Mohamed Rilwan",
    nicNumber: "198533201944",
    trade: "Industrial & Domestic Plumber",
    category: "plumbing",
    district: "Colombo",
    locality: "Dehiwala",
    experienceYears: 15,
    phone: "+94 76 999 1234",
    vehicleType: "Van with Pipe Fitting Rig",
    plateNumber: "WP-CAP-1904",
    nicFrontUrl: "nic_rilwan.jpg",
    skillCertUrl: "plumbing_trade_union_cert.jpg",
    status: "PENDING",
    submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "APP-4015",
    fullName: "Bandara Dissanayake",
    nicNumber: "199104509122",
    trade: "House & Roof Pressure Cleaner",
    category: "cleaning",
    district: "Kandy",
    locality: "Peradeniya",
    experienceYears: 5,
    phone: "+94 70 333 9876",
    vehicleType: "Single Cab Pickup",
    plateNumber: "CP-PX-7721",
    status: "PENDING",
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const INITIAL_HAZARDS: CivicHazardIncident[] = [
  {
    id: "HAZ-5501",
    title: "Large Tree Branch Collapsed onto 230V Power Lines",
    category: "tree-cutting",
    district: "Colombo",
    locality: "Maharagama (Temple Rd)",
    urgency: "CRITICAL",
    reportedBy: "Resident Community Watch",
    reportedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: "DISPATCHED",
    assignedCrew: "Sunil Kumara (WP-ABX-8821)",
    description: "Monsoon storm caused a 30-foot coconut tree branch to snap and hang dangerously over public road cables.",
  },
  {
    id: "HAZ-4420",
    title: "Main Road PVC Water Supply Joint Rupture",
    category: "plumbing",
    district: "Gampaha",
    locality: "Kadawatha Junction",
    urgency: "HIGH",
    reportedBy: "Gramaniladhari Division",
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "OPEN",
    description: "High-pressure clean water spraying across pedestrian walkway.",
  },
  {
    id: "HAZ-3319",
    title: "Public Storm Drain Debris Blockage & Flash Puddle",
    category: "cleaning",
    district: "Kandy",
    locality: "Katugastota Bridge",
    urgency: "MEDIUM",
    reportedBy: "Municipal Civic App",
    reportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: "RESOLVED",
    assignedCrew: "Asanka Bandara Cleaning Team",
    description: "Leaves and mud clogging roadside storm outlet before heavy evening rain.",
  },
];

const DISTRICT_METRICS: DistrictMetric[] = [
  {
    district: "Colombo",
    province: "Western Province",
    activeJobs: 184,
    verifiedWorkers: 142,
    totalSettledLKR: 1840000,
    avgResponseMins: 14,
    hazardResolutionRate: 98.4,
  },
  {
    district: "Gampaha",
    province: "Western Province",
    activeJobs: 142,
    verifiedWorkers: 98,
    totalSettledLKR: 1250000,
    avgResponseMins: 18,
    hazardResolutionRate: 95.2,
  },
  {
    district: "Kandy",
    province: "Central Province",
    activeJobs: 118,
    verifiedWorkers: 76,
    totalSettledLKR: 920000,
    avgResponseMins: 22,
    hazardResolutionRate: 94.0,
  },
  {
    district: "Galle",
    province: "Southern Province",
    activeJobs: 86,
    verifiedWorkers: 54,
    totalSettledLKR: 680000,
    avgResponseMins: 24,
    hazardResolutionRate: 96.1,
  },
];

const STORAGE_ADMIN_APP_KEY = "sus_admin_applications_v1";
const STORAGE_ADMIN_HAZ_KEY = "sus_admin_hazards_v1";

export const adminService = {
  getApplications(): PendingWorkerApplication[] {
    if (typeof window === "undefined") return INITIAL_APPLICATIONS;
    const stored = localStorage.getItem(STORAGE_ADMIN_APP_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_ADMIN_APP_KEY, JSON.stringify(INITIAL_APPLICATIONS));
      return INITIAL_APPLICATIONS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_APPLICATIONS;
    }
  },

  updateApplicationStatus(
    appId: string,
    status: "APPROVED" | "REJECTED",
    rejectionReason?: string
  ): PendingWorkerApplication | null {
    const apps = this.getApplications();
    const target = apps.find((a) => a.id === appId);
    if (!target) return null;

    target.status = status;
    if (rejectionReason) target.rejectionReason = rejectionReason;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ADMIN_APP_KEY, JSON.stringify(apps));
    }
    return target;
  },

  getHazards(): CivicHazardIncident[] {
    if (typeof window === "undefined") return INITIAL_HAZARDS;
    const stored = localStorage.getItem(STORAGE_ADMIN_HAZ_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_ADMIN_HAZ_KEY, JSON.stringify(INITIAL_HAZARDS));
      return INITIAL_HAZARDS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_HAZARDS;
    }
  },

  dispatchHazard(hazardId: string, crewName: string): CivicHazardIncident | null {
    const hazards = this.getHazards();
    const target = hazards.find((h) => h.id === hazardId);
    if (!target) return null;

    target.status = "DISPATCHED";
    target.assignedCrew = crewName;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ADMIN_HAZ_KEY, JSON.stringify(hazards));
    }
    return target;
  },

  getDistrictMetrics(): DistrictMetric[] {
    return DISTRICT_METRICS;
  },
};
