import {
  UserProfile,
  UserRole,
  AuthSession,
  LoginCredentials,
  HomeownerRegistrationData,
  ProviderRegistrationData,
} from "@/types/auth";
import { apiClient } from "./api";

const AUTH_STORAGE_KEY = "smart_urban_auth_session";

// ── Default Fallback Seed Profiles ─────────────────────────────
const DEMO_HOMEOWNER: UserProfile = {
  id: "USR-8821",
  fullName: "Anura Senanayake",
  email: "anura.senanayake@gmail.com",
  phone: "+94 77 123 4567",
  role: "HOMEOWNER",
  locality: "Maharagama Town",
  district: "Colombo",
  createdAt: "2026-01-15T10:00:00Z",
};

const DEMO_PROVIDER: UserProfile = {
  id: "PRV-4402",
  fullName: "Kamal Perera",
  email: "kamal.perera@gmail.com",
  phone: "+94 71 987 6543",
  role: "PROVIDER",
  locality: "Nugegoda East",
  district: "Colombo",
  trade: "Master Painter & Wall Specialist",
  tradeType: "painting",
  nicNumber: "198824109281",
  experienceYears: 12,
  dailyRate: 3500,
  hourlyRate: 600,
  verifiedBadge: true,
  vehicleType: "Three Wheeler & Ladders",
  plateNumber: "WP-ABX-8821",
  status: "AVAILABLE",
  createdAt: "2025-11-20T08:30:00Z",
};

const DEMO_ADMIN: UserProfile = {
  id: "ADM-001",
  fullName: "Platform Quality Operations",
  email: "ops.admin@smarturban.lk",
  phone: "+94 11 280 4400",
  role: "ADMIN",
  staffId: "STF-COL-8890",
  department: "National Quality & Hazard Control",
  accessLevel: "SUPER_ADMIN",
  locality: "Colombo 07",
  district: "Colombo",
  createdAt: "2025-01-01T00:00:00Z",
};

class AuthService {
  private getStorage(): Storage | null {
    if (typeof window !== "undefined") {
      return window.localStorage;
    }
    return null;
  }

  public getSession(): AuthSession | null {
    const storage = this.getStorage();
    if (!storage) return null;
    try {
      const data = storage.getItem(AUTH_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as AuthSession;
    } catch {
      return null;
    }
  }

  public getCurrentUser(): UserProfile | null {
    const session = this.getSession();
    return session ? session.user : null;
  }

  public setSession(user: UserProfile, token?: string): AuthSession {
    const session: AuthSession = {
      token: token || `jwt_token_${user.id}_${Date.now()}`,
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
    return session;
  }

  public async login(credentials: LoginCredentials): Promise<UserProfile> {
    if (credentials.role === "ADMIN") {
      return this.adminLogin(credentials.identifier, credentials.password || "");
    }

    const email = credentials.identifier.includes("@")
      ? credentials.identifier.trim()
      : `${credentials.identifier.replace(/\D/g, "")}@smarturban.lk`;

    const password = credentials.password || "Password123";

    const response = await apiClient<{ success: boolean; token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response?.success && response?.user) {
      const backendUser = response.user;

      if (credentials.role === "PROVIDER" && backendUser.role !== "service_provider") {
        throw new Error(
          "This account is registered as a Citizen / Homeowner. Please switch to the Citizen tab to log in, or register as a Service Provider."
        );
      }

      if (credentials.role === "HOMEOWNER" && backendUser.role === "service_provider") {
        throw new Error(
          "This account is registered as a Service Provider. Please switch to the Service Provider tab to log in, or register as a Citizen."
        );
      }

      const mappedUser: UserProfile = {
        id: `USR-${backendUser.id}`,
        fullName: backendUser.name,
        email: backendUser.email,
        phone: backendUser.phone || credentials.identifier,
        role: backendUser.role === "service_provider" ? "PROVIDER" : "HOMEOWNER",
        profilePicture: backendUser.profile_picture || undefined,
        homeAddress: backendUser.home_address || undefined,
        savedLat: backendUser.saved_lat ? Number(backendUser.saved_lat) : undefined,
        savedLng: backendUser.saved_lng ? Number(backendUser.saved_lng) : undefined,
        locality: backendUser.locality || (backendUser.role === "service_provider" ? "Colombo" : "Colombo Urban"),
        district: backendUser.district || "Colombo",
        trade: backendUser.trade || (backendUser.role === "service_provider" ? "Technician & Craftsman" : undefined),
        createdAt: backendUser.created_at || new Date().toISOString(),
      };

      this.setSession(mappedUser, response.token);
      return mappedUser;
    }

    throw new Error("Invalid email/phone or password. Please try again.");
  }

  public async registerHomeowner(data: HomeownerRegistrationData): Promise<UserProfile> {
    const rawPhoneDigits = data.phone.replace(/\D/g, "");
    const email = data.email?.trim() || `${rawPhoneDigits}@smarturban.lk`;
    const password = data.password || "Password123";

    const response = await apiClient<{ success: boolean; token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: data.fullName,
        email,
        password,
        role: "citizen",
        phone: data.phone,
      }),
    });

    if (response?.success && response?.user) {
      const backendUser = response.user;
      const newUser: UserProfile = {
        id: `USR-${backendUser.id}`,
        fullName: backendUser.name,
        email: backendUser.email,
        phone: backendUser.phone || data.phone,
        role: "HOMEOWNER",
        locality: data.locality,
        district: data.district,
        createdAt: backendUser.created_at || new Date().toISOString(),
      };

      this.setSession(newUser, response.token);
      return newUser;
    }

    throw new Error("Failed to create homeowner account. Please try again.");
  }

  public async registerProvider(data: ProviderRegistrationData): Promise<UserProfile> {
    const rawPhoneDigits = data.phone.replace(/\D/g, "");
    const email = data.email?.trim() || `${rawPhoneDigits}@smarturban.lk`;
    const password = data.password || "Password123";

    const response = await apiClient<{ success: boolean; token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: data.fullName,
        email,
        password,
        role: "service_provider",
        phone: data.phone,
      }),
    });

    if (response?.success && response?.user) {
      const backendUser = response.user;

      // Sync provider profile details & NIC document into PostgreSQL
      await apiClient(`/users/profile/${backendUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: data.fullName,
          phone: data.phone,
          trade: data.trade,
          dailyRate: data.dailyRate,
          hourlyRate: data.hourlyRate,
          experienceYears: data.experienceYears,
          nicNumber: data.nicNumber,
          nicDocumentUrl: data.nicFrontUrl || data.skillCertUrl,
          locality: data.locality,
          district: data.district,
        }),
      }).catch(() => {});

      const newProvider: UserProfile = {
        id: `PRV-${backendUser.id}`,
        fullName: backendUser.name,
        email: backendUser.email,
        phone: backendUser.phone || data.phone,
        role: "PROVIDER",
        locality: data.locality,
        district: data.district,
        trade: data.trade,
        tradeType: (data.tradeType as any) || "painting",
        nicNumber: data.nicNumber,
        experienceYears: data.experienceYears,
        dailyRate: data.dailyRate,
        hourlyRate: data.hourlyRate,
        verifiedBadge: false,
        status: "AVAILABLE",
        createdAt: backendUser.created_at || new Date().toISOString(),
      };

      this.setSession(newProvider, response.token);
      return newProvider;
    }

    throw new Error("Failed to create provider account. Please try again.");
  }

  public async adminLogin(identifier: string, securityPass: string): Promise<UserProfile> {
    const email = identifier.includes("@") ? identifier.trim() : "admin@smarturban.lk";
    const password = securityPass.trim();

    if (!password) {
      throw new Error("Password is required for admin login.");
    }

    const response = await apiClient<{ success: boolean; token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response?.success && response?.user) {
      if (response.user.role !== "admin") {
        throw new Error("Access Denied: This account is not authorized for Admin Console access.");
      }

      const adminUser: UserProfile = {
        id: `ADM-${response.user.id}`,
        fullName: response.user.name || "System Admin",
        email: response.user.email,
        phone: response.user.phone || "+94 11 280 4400",
        role: "ADMIN",
        staffId: identifier.toUpperCase(),
        department: "Platform Quality Operations",
        accessLevel: "SUPER_ADMIN",
        locality: "Colombo 07",
        district: "Colombo",
        createdAt: response.user.created_at || new Date().toISOString(),
      };

      this.setSession(adminUser, response.token);
      return adminUser;
    }

    throw new Error("Invalid admin username/email or password.");
  }

  public getToken(): string | null {
    const session = this.getSession();
    return session ? session.token : null;
  }

  public logout(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  public getDemoProfiles() {
    return {
      homeowner: DEMO_HOMEOWNER,
      provider: DEMO_PROVIDER,
      admin: DEMO_ADMIN,
    };
  }
}

export const authService = new AuthService();
