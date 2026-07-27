import { api } from "./api";

export interface Fine {
  id: number;
  userId: number;
  borrowId?: number | null;
  amount: number | string;
  status: string;
  reason?: string | null;
  dueDate?: string | null;
  createdAt?: string;
}

export interface FinePayment {
  id?: number;
  fineId: number;
  userId: number;
  amount: number;
  amountPaid?: number;
  paymentMethod?: string;
  transactionRef?: string;
}

export function fineAmount(fine: Fine): number {
  return typeof fine.amount === "number" ? fine.amount : Number(fine.amount || 0);
}

export const finesService = {
  getForUser: (userId: number): Promise<Fine[]> =>
    api.get<Fine[]>(`/api/fines/user/${userId}`),

  pay: (payment: FinePayment): Promise<FinePayment> =>
    api.post<FinePayment>("/api/fine-payments", payment),
};
