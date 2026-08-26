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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Rehydrate session from localStorage
    const existing = authService.getCurrentUser();
    if (existing) {
      setUser(existing);
    }
    setIsLoading(false);
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
      router.push("/dashboard");
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
    };
  }
  return context;
}
