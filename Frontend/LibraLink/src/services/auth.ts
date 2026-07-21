import { API_BASE_URL } from "../config/api";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  institutionId: number;
}

export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  institutionId: number | null;
}

export const authService = {
  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    const body = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.passwordHash,
    };
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Registration failed.");
    }
    return data;
  },

  registerLibrarian: async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/auth/register-librarian`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Librarian registration failed.");
    }
    return data;
  },

  registerLecturer: async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register-lecturer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Lecturer registration failed.");
    }
    return data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Invalid email or password.");
    }
    return data;
  },
};
