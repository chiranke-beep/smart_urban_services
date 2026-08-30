"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  UserProfile,
  UserRole,
  LoginCredentials,
  HomeownerRegistrationData,
  ProviderRegistrationData,
} from "@/types/auth";
import { authService } from "@/services/authService";
import { socketService } from "@/services/socketService";
import { getApiBaseUrl } from "@/services/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<UserProfile>;
  registerHomeowner: (data: HomeownerRegistrationData) => Promise<UserProfile>;
  registerProvider: (data: ProviderRegistrationData) => Promise<UserProfile>;
  adminLogin: (staffId: string, securityPass: string) => Promise<UserProfile>;
  logout: () => void;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  updateUser: (updated: Partial<UserProfile>) => void;
  reloadUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = (userId?: string | number) => {
    const rawId = String(userId || "").replace(/\D/g, "");
    const base = getApiBaseUrl();
    fetch(`${base}/users/profile/${rawId || 2}`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.data) {
          const d = res.data;
          setUser((prev) => {
            if (!prev) return prev;
            const finalPic = d.profilePicture ? d.profilePicture : prev.profilePicture;
            const synced: UserProfile = {
              ...prev,
              id: prev.id || `USR-${d.id}`,
              fullName: d.fullName || prev.fullName,
              phone: d.phone || prev.phone,
              profilePicture: finalPic || undefined,
              homeAddress: d.homeAddress || prev.homeAddress,
              savedLat: d.savedLat ? Number(d.savedLat) : prev.savedLat,
              savedLng: d.savedLng ? Number(d.savedLng) : prev.savedLng,
              birthday: d.birthday || prev.birthday,
              gender: d.gender || prev.gender,
              language: d.language || prev.language,
              trade: d.trade || prev.trade,
              dailyRate: d.dailyRate ? Number(d.dailyRate) : prev.dailyRate,
              verifiedBadge: d.verified === true,
              verificationStatus: d.verificationStatus || (d.verified ? "APPROVED" : "PENDING"),
              rejectionReason: d.rejectionReason || undefined,
            };
            authService.setSession(synced, authService.getToken() || "");
            return synced;
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Rehydrate session from localStorage
    const existing = authService.getCurrentUser();
    if (existing) {
      setUser(existing);
      refreshProfile(existing.id);
    }
    setIsLoading(false);

    // Real-time WebSocket listener for admin verification / suspension updates
    const handleVerificationUpdate = (data: { userId: string; verified: boolean; status: string; rejectionReason?: string }) => {
      const cur = authService.getCurrentUser();
      const curId = cur ? String(cur.id).replace(/\D/g, "") : "";
      if (curId && curId === String(data.userId).replace(/\D/g, "")) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated: UserProfile = {
            ...prev,
            verifiedBadge: data.verified === true && data.status === "APPROVED",
            verificationStatus: data.status as any,
            rejectionReason: data.rejectionReason,
          };
          authService.setSession(updated, authService.getToken() || "");
          return updated;
        });
      }
    };

    const unsub = socketService.onWorkerVerificationUpdated(handleVerificationUpdate);

    return () => {
      unsub();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const loggedUser = await authService.login(credentials);
    setUser(loggedUser);
    return loggedUser;
  };

  const registerHomeowner = async (data: HomeownerRegistrationData) => {
    const newUser = await authService.registerHomeowner(data);
    setUser(newUser);
    return newUser;
  };

  const registerProvider = async (data: ProviderRegistrationData) => {
    const newProvider = await authService.registerProvider(data);
    setUser(newProvider);
    return newProvider;
  };

  const adminLogin = async (staffId: string, securityPass: string) => {
    const admin = await authService.adminLogin(staffId, securityPass);
    setUser(admin);
    return admin;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push("/login");
  };

  const quickDemoLogin = async (role: UserRole) => {
    const demos = authService.getDemoProfiles();
    if (role === "ADMIN") {
      await adminLogin("STF-COL-8890", "ADMIN_PASS");
      router.push("/admin/dashboard");
    } else if (role === "PROVIDER") {
      await login({ identifier: demos.provider.phone, role: "PROVIDER" });
      router.push("/provider/dashboard");
    } else {
      await login({ identifier: demos.homeowner.phone, role: "HOMEOWNER" });
      router.push("/citizen/dashboard");
    }
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updated };
      if (!updated.profilePicture) {
        delete next.profilePicture;
      }
      authService.setSession(next, authService.getToken() || "");
      return next;
    });
  };

  const reloadUser = () => {
    const fresh = authService.getCurrentUser();
    if (fresh) {
      setUser(fresh);
      refreshProfile(fresh.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user ? user.role : null,
        isLoading,
        login,
        registerHomeowner,
        registerProvider,
        adminLogin,
        logout,
        quickDemoLogin,
        updateUser,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isAuthenticated: false,
      role: null,
      isLoading: false,
      login: async (credentials: LoginCredentials) => authService.login(credentials),
      registerHomeowner: async (data: HomeownerRegistrationData) => authService.registerHomeowner(data),
      registerProvider: async (data: ProviderRegistrationData) => authService.registerProvider(data),
      adminLogin: async (staffId: string, securityPass: string) => authService.adminLogin(staffId, securityPass),
      logout: () => authService.logout(),
      quickDemoLogin: async () => {},
      updateUser: () => {},
      reloadUser: () => {},
    };
  }
  return context;
}
