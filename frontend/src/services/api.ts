export function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    const proto = window.location.protocol;
    const host = window.location.hostname;
    return `${proto}//${host}:5000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
}

const API_BASE = getApiBaseUrl();

const AUTH_STORAGE_KEY = "smart_urban_auth_session";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return parsed.token || null;
  } catch {
    return null;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message || data?.errors?.[0]?.msg || `API Error (${res.status}): ${res.statusText}`;
      throw new Error(msg);
    }

    return data as T;
  } catch (err: any) {
    console.warn(`[API error on ${endpoint}]:`, err.message);
    throw err;
  }
}

export { API_BASE };
