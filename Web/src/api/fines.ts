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

export const finesApi = {
  getForUser: (userId: number) => api.get<Fine[]>(`/api/fines/user/${userId}`),
};
