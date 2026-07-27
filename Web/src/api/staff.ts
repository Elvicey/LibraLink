import { api } from "./client";

export interface SchoolAdminInviteResponse {
  email: string;
  otp: string;
  expiresInMinutes: number;
  note: string;
}

export interface LibrarianCodeResponse {
  schoolId: number;
  librarianCode: string;
}

export const staffApi = {
  // SCHOOL_ADMIN_ONLY - always scoped to the caller's own school.
  inviteSchoolAdmin: (email: string) =>
    api.post<SchoolAdminInviteResponse>("/api/school-admins/invite", { email }),

  issueLibrarianCode: () => api.post<LibrarianCodeResponse>("/api/librarian-codes"),
};
