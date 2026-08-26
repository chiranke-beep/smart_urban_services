import {
  UserProfile,
  UserRole,
  AuthSession,
  LoginCredentials,
  HomeownerRegistrationData,
  ProviderRegistrationData,
} from "@/types/auth";

const AUTH_STORAGE_KEY = "smart_urban_auth_session";

// ── Demo Pre-Seeded Profiles for 1-Click Fast Sign-In ──────────
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

  public setSession(user: UserProfile): AuthSession {
    const session: AuthSession = {
      token: `jwt_token_${user.id}_${Date.now()}`,
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
    // Simulate slight network verification delay
    await new Promise((res) => setTimeout(res, 400));

    if (credentials.role === "ADMIN") {
      return this.adminLogin(credentials.identifier, credentials.password || "");
    }

    if (credentials.role === "PROVIDER") {
      const user: UserProfile = {
        ...DEMO_PROVIDER,
        phone: credentials.identifier.startsWith("+94") || credentials.identifier.startsWith("07")
          ? credentials.identifier
          : DEMO_PROVIDER.phone,
        email: credentials.identifier.includes("@") ? credentials.identifier : DEMO_PROVIDER.email,
      };
      this.setSession(user);
      return user;
    }

    // Default: Homeowner
    const user: UserProfile = {
      ...DEMO_HOMEOWNER,
      phone: credentials.identifier.startsWith("+94") || credentials.identifier.startsWith("07")
        ? credentials.identifier
        : DEMO_HOMEOWNER.phone,
      email: credentials.identifier.includes("@") ? credentials.identifier : DEMO_HOMEOWNER.email,
    };
    this.setSession(user);
    return user;
  }

  public async registerHomeowner(data: HomeownerRegistrationData): Promise<UserProfile> {
    await new Promise((res) => setTimeout(res, 500));

    const newUser: UserProfile = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: "HOMEOWNER",
      locality: data.locality,
      district: data.district,
      createdAt: new Date().toISOString(),
    };

    this.setSession(newUser);
    return newUser;
  }

  public async registerProvider(data: ProviderRegistrationData): Promise<UserProfile> {
    await new Promise((res) => setTimeout(res, 600));

    const newProvider: UserProfile = {
      id: `PRV-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: "PROVIDER",
      locality: data.locality,
      district: data.district,
      trade: data.trade,
      tradeType: data.tradeType,
      nicNumber: data.nicNumber,
      experienceYears: data.experienceYears,
      dailyRate: data.dailyRate,
      hourlyRate: data.hourlyRate,
      verifiedBadge: false, // Pending admin inspection
      vehicleType: data.vehicleType,
      plateNumber: data.plateNumber,
      status: "AVAILABLE",
      createdAt: new Date().toISOString(),
    };

    this.setSession(newProvider);
    return newProvider;
  }

  public async adminLogin(staffId: string, securityPass: string): Promise<UserProfile> {
    await new Promise((res) => setTimeout(res, 400));

    const adminUser: UserProfile = {
      ...DEMO_ADMIN,
      staffId: staffId.toUpperCase(),
    };

    this.setSession(adminUser);
    return adminUser;
  }

  public logout(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  // Pre-configured 1-click test profiles
  public getDemoProfiles() {
    return {
      homeowner: DEMO_HOMEOWNER,
      provider: DEMO_PROVIDER,
      admin: DEMO_ADMIN,
    };
  }
}

export const authService = new AuthService();
