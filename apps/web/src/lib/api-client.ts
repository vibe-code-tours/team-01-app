interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function fetchSession(): Promise<ApiResponse> {
  const res = await fetch("/api/auth/get-session", {
    credentials: "include",
  });
  const text = await res.text();
  if (!text) {
    return { success: false, error: "Not authenticated" };
  }
  const data = JSON.parse(text);
  if (!data || !data.user) {
    return { success: false, error: "Not authenticated" };
  }
  return { success: true, data };
}

export async function signIn(
  email: string,
  password: string
): Promise<ApiResponse> {
  const res = await fetch("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = "Invalid credentials";
    try { message = JSON.parse(text).message || message; } catch { /* empty */ }
    return { success: false, error: message };
  }
  if (!text) return { success: true, data: {} };
  return { success: true, data: JSON.parse(text) };
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/sign-out", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

export async function publicFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
  });
  const text = await res.text();
  if (!text) return { success: false, error: "Empty response" };
  return JSON.parse(text);
}

export async function userFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`/api/user${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
  });
  const text = await res.text();
  if (!text) return { success: false, error: "Empty response" };
  return JSON.parse(text);
}

export async function adminFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`/api/admin${path}`, {
    credentials: "include",
    ...options,
  });
  const text = await res.text();
  if (!text) return { success: false, error: "Empty response" };
  return JSON.parse(text);
}
