import { api } from "./client";

// Matches Backend dto/AuthResponse.java exactly (camelCase on the wire, confirmed
// convention across this whole API). schoolId and institutionId carry the same
// underlying value - the portal reads schoolId, the mobile app reads institutionId.
export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  institutionId: number | null;
  schoolId: number | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SchoolAdminSignupPayload {
  schoolCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SchoolAdminJoinPayload {
  email: string;
  otp: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface RegisterLibrarianPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  librarianCode: string;
}

export const authApi = {
  login: (payload: LoginPayload) => api.post<AuthResponse>("/api/auth/login", payload, false),

  schoolAdminSignup: (payload: SchoolAdminSignupPayload) =>
    api.post<AuthResponse>("/api/auth/school-admin-signup", payload, false),

  schoolAdminJoin: (payload: SchoolAdminJoinPayload) =>
    api.post<AuthResponse>("/api/auth/school-admin-join", payload, false),

  // Staff-authenticated action (bearer token required) - not a public signup, despite
  // living alongside the other auth flows. The caller must already be logged in as
  // LIBRARIAN/ADMIN/SCHOOL_ADMIN and hold a librarian_code for their own school.
  registerLibrarian: (payload: RegisterLibrarianPayload) =>
    api.post<AuthResponse>("/api/auth/register-librarian", payload, true),
};
