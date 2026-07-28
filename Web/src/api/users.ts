import { api } from "./client";

export interface UserRole {
  id: number;
  name: string;
}

// Matches Backend entity/User.java on the wire. passwordHash is @JsonIgnore'd.
// Note: the JSON key is "active", not "isActive" - Jackson strips the "is" prefix
// from the isActive() getter when deriving the bean property name.
export interface StaffUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  studentId: string | null;
  active: boolean;
  roles: UserRole[];
}

export const usersApi = {
  // STAFF-only, school-scoped for non-platform callers (GET /api/users).
  list: () => api.get<StaffUser[]>("/api/users"),

  // STAFF-only (POST /api/users/{id}/roles). Grants the given role to the user
  // (additive - doesn't remove existing roles).
  assignRole: (id: number, role: string) =>
    api.post<{ userId: number; roles: string[] }>(`/api/users/${id}/roles`, { role }),

  // STAFF-only, school-scoped (GET /api/users/student/{studentId}). Librarians know a
  // student's student number, not their internal numeric id - this resolves one to the
  // other for CirculationScan/FinesLookup.
  getByStudentId: (studentId: string) => api.get<StaffUser>(`/api/users/student/${encodeURIComponent(studentId)}`),
};
