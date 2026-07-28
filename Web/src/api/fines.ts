import { api } from "./client";

// Matches Backend entity/Fine.java on the wire.
export interface Fine {
  id: number;
  userId: number;
  borrowId: number | null;
  amount: number;
  status: string;
  reason: string | null;
  dueDate: string | null;
  createdAt: string;
}

export interface IssueFinePayload {
  userId: number;
  amount: number;
  reason?: string;
}

export const finesApi = {
  getForUser: (userId: number) => api.get<Fine[]>(`/api/fines/user/${userId}`),

  // STAFF-only (POST /api/fines). schoolId is server-stamped from the caller's session.
  issue: (payload: IssueFinePayload) => api.post<Fine>("/api/fines", payload),
};
