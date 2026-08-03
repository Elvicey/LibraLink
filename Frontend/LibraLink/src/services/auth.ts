import { API_BASE_URL } from "../config/api";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  institutionId: number;
  studentId: string;
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

// Registration no longer logs the account in directly - it only confirms a verification
// code was emailed. verifyEmail() is what actually returns a LoginResponse and establishes
// the session, once the emailed code is confirmed.
export interface RegisterPendingResponse {
  email: string;
  message: string;
}

export const authService = {
  register: async (payload: RegisterPayload): Promise<RegisterPendingResponse> => {
    const body = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.passwordHash,
      institutionId: payload.institutionId,
      studentId: payload.studentId,
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

  verifyEmail: async (email: string, code: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Invalid verification code.");
    }
    return data;
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to resend verification code.");
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

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to send verification code.");
    }
    return data;
  },

  verifyResetCode: async (email: string, code: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-reset-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Invalid verification code.");
    }
    return data;
  },

  resetPassword: async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to reset password.");
    }
    return data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const token = await AsyncStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || "Failed to change password.");
    }
    return data;
  },
};
