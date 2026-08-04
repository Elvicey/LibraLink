import { api } from "./client";

// Matches Backend entity/FinePayment.java on the wire.
export interface FinePayment {
  id: number;
  fineId: number;
  userId: number;
  amount: number;
  amountPaid: number;
  paymentMethod: string | null;
  paidAt: string;
}

export interface RecordPaymentPayload {
  fineId: number;
  userId: number;
  amountPaid: number;
  paymentMethod: string;
}

export const finePaymentsApi = {
  // LIBRARIAN/ADMIN/SCHOOL_ADMIN-only (POST /api/fine-payments). Records an in-person
  // payment (e.g. cash at the desk) and marks the fine PAID directly, no Paystack charge -
  // the student-facing online flow (fines.ts has no client for it) goes through
  // /api/fine-payments/initialize + /verify instead.
  pay: (payload: RecordPaymentPayload) => api.post<FinePayment>("/api/fine-payments", payload),
};
