"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { WorkerVerificationQueue } from "@/components/admin/WorkerVerificationQueue";
import { AdminDistrictAnalytics } from "@/components/admin/AdminDistrictAnalytics";
import { CivicHazardMonitor } from "@/components/admin/CivicHazardMonitor";
import { adminService } from "@/services/adminService";
import {
  PendingWorkerApplication,
  CivicHazardIncident,
  DistrictMetric,
} from "@/types/admin";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<PendingWorkerApplication[]>([]);
  const [hazards, setHazards] = useState<CivicHazardIncident[]>([]);
  const [metrics, setMetrics] = useState<DistrictMetric[]>([]);
  const [activeTab, setActiveTab] = useState("verification");
  const { theme } = useTheme();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
      router.replace("/admin/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const loadAdminData = async () => {
    const [apps, haz, met] = await Promise.all([
      adminService.fetchApplications(),
      adminService.fetchHazards(),
      adminService.fetchDistrictMetrics(),
    ]);
    setApplications(apps);
    setHazards(haz);
    setMetrics(met);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const pendingAppsCount = applications.filter((a) => a.status === "PENDING").length;
  const openHazardsCount = hazards.filter((h) => h.status !== "RESOLVED").length;

  const handleApprove = async (appId: string) => {
    await adminService.updateApplicationStatus(appId, "APPROVED");
    loadAdminData();
  };

  const handleReject = async (appId: string, reason?: string) => {
    await adminService.updateApplicationStatus(appId, "REJECTED", reason);
    loadAdminData();
  };

  const handleDispatchHazard = (hazardId: string, crewName: string) => {
    adminService.dispatchHazard(hazardId, crewName);
    setHazards(adminService.getHazards());
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "inherit",
      }}
    >
      {/* ── Left Admin Sidebar Navigation ── */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingVerificationsCount={pendingAppsCount}
        openHazardsCount={openHazardsCount}
      />

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AdminHeader />

        <main style={{ padding: "32px", flex: 1, display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* ═══════════════════════════════════════════════════════════════
              TAB 1: NIC & TRADE VERIFICATION QUEUE (PRIMARY VIEW)
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "verification" && (
            <WorkerVerificationQueue
              applications={applications}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 2: DISTRICT & PROVINCIAL TELEMETRY
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "analytics" && (
            <AdminDistrictAnalytics metrics={metrics} />
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 3: CIVIC HAZARDS & EMERGENCY TRIAGE
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "hazards" && (
            <CivicHazardMonitor
              hazards={hazards}
              onDispatchCrew={handleDispatchHazard}
            />
          )}
        </main>
      </div>
    </div>
  );
}
