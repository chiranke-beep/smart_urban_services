import {
  PendingWorkerApplication,
  CivicHazardIncident,
  DistrictMetric,
} from "@/types/admin";
import { apiClient } from "./api";

const STORAGE_ADMIN_APP_KEY = "sus_admin_applications_live";
const STORAGE_ADMIN_HAZ_KEY = "sus_admin_hazards_live";

export const adminService = {
  async fetchApplications(): Promise<PendingWorkerApplication[]> {
    try {
      const res = await apiClient<{ success: boolean; data?: any[] }>("/admin/workers");
      if (res?.data && Array.isArray(res.data)) {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_ADMIN_APP_KEY, JSON.stringify(res.data));
        }
        return res.data;
      }
    } catch (err) {
      console.warn("[Admin Applications fetch notice]:", err);
    }
    return this.getApplications();
  },

  getApplications(): PendingWorkerApplication[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_ADMIN_APP_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  async updateApplicationStatus(
    appId: string,
    status: "APPROVED" | "REJECTED",
    rejectionReason?: string
  ): Promise<PendingWorkerApplication | null> {
    const rawId = appId.replace(/\D/g, "");

    try {
      await apiClient(`/admin/workers/${rawId}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason }),
      });
    } catch (err) {
      console.warn("[Admin Verify sync notice]:", err);
    }

    const apps = this.getApplications();
    const target = apps.find((a) => a.id === appId);
    if (target) {
      target.status = status;
      if (rejectionReason) target.rejectionReason = rejectionReason;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ADMIN_APP_KEY, JSON.stringify(apps));
      }
    }
    return target || null;
  },

  async fetchHazards(): Promise<CivicHazardIncident[]> {
    try {
      const res = await apiClient<{ success: boolean; data?: any[] }>("/admin/hazards");
      if (res?.data && Array.isArray(res.data)) {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_ADMIN_HAZ_KEY, JSON.stringify(res.data));
        }
        return res.data;
      }
    } catch (err) {
      console.warn("[Admin Hazards fetch notice]:", err);
    }
    return this.getHazards();
  },

  getHazards(): CivicHazardIncident[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_ADMIN_HAZ_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
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

  async fetchDistrictMetrics(): Promise<DistrictMetric[]> {
    try {
      const res = await apiClient<{ success: boolean; data?: any[] }>("/admin/analytics");
      if (res?.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn("[Admin Analytics fetch notice]:", err);
    }
    return [
      {
        district: "Kandy",
        province: "Central",
        activeJobs: 2,
        verifiedWorkers: 2,
        hazardResolutionRate: 98.5,
        avgResponseMins: 14,
        totalSettledLKR: 6000,
      },
    ];
  },

  getDistrictMetrics(): DistrictMetric[] {
    return [
      {
        district: "Kandy",
        province: "Central",
        activeJobs: 2,
        verifiedWorkers: 2,
        hazardResolutionRate: 98.5,
        avgResponseMins: 14,
        totalSettledLKR: 6000,
      },
    ];
  },
};
