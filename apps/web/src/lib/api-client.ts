const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api-bir004ynp-klockdevops.vercel.app";
const TOKEN_KEY = "water-delivery-token";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchSession(): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/api/auth/get-session`, {
    credentials: "include",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data || !data.user) {
    return { success: false, error: "Not authenticated" };
  }
  return { success: true, data };
}

export async function signIn(
  email: string,
  password: string
): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.message || "Invalid credentials" };
  }
  if (data.token) {
    setToken(data.token);
  }
  return { success: true, data };
}

export async function signOut(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/sign-out`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
  });
  clearToken();
}

export async function adminFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...authHeaders(),
      ...options?.headers,
    },
  });
  return res.json();
}
