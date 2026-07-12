export type Role = "user" | "admin" | "delivery" | "super-admin";

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    phone: string | null;
  };
  token: string;
}
