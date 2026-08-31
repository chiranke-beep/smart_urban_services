import {
  PendingWorkerApplication,
  DistrictMetric,
} from "@/types/admin";
import { apiClient } from "./api";

const STORAGE_ADMIN_APP_KEY = "sus_admin_applications_live";

export const adminService = {
  async fetchApplications(): Promise<PendingWorkerApplication[]> {
    try {
      const res = await apiClient<{ success: boolean; data?: any[] }>("/admin/workers");
      if (res?.data && Array.isArray(res.data)) {
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_ADMIN_APP_KEY, JSON.stringify(res.data));
          }
        } catch {
          // Ignore localStorage quota exceeded errors on large NIC image documents
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
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_ADMIN_APP_KEY, JSON.stringify(apps));
        }
      } catch {
        // Ignore quota error
      }
    }
    return target || null;
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
    return [];
  },

  getDistrictMetrics(): DistrictMetric[] {
    return [];
  },
};
