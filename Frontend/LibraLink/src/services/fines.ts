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

export interface NewFine {
  userId: number;
  amount: number;
  reason?: string;
  borrowId?: number | null;
}

/** Response from starting a Paystack checkout for one fine. */
export interface PaymentInit {
  authorizationUrl: string;
  reference: string;
  publicKey: string;
}

/** Response from verifying a Paystack transaction server-side. */
export interface PaymentVerify {
  paid: boolean;
  status: string;
  message: string;
}

export const finesService = {
  getForUser: (userId: number): Promise<Fine[]> =>
    api.get<Fine[]>(`/api/fines/user/${userId}`),

  pay: (payment: FinePayment): Promise<FinePayment> =>
    api.post<FinePayment>("/api/fine-payments", payment),

  /** Issue a fine to a user (LIBRARIAN/ADMIN). */
  create: (fine: NewFine): Promise<Fine> =>
    api.post<Fine>("/api/fines", { ...fine, status: "UNPAID" }),

  /** Start a real Paystack checkout for a single fine. */
  initializePayment: (fineId: number): Promise<PaymentInit> =>
    api.post<PaymentInit>("/api/fine-payments/initialize", { fineId }),

  /** Confirm a Paystack transaction; the fine is only marked paid if it succeeded. */
  verifyPayment: (reference: string): Promise<PaymentVerify> =>
    api.post<PaymentVerify>("/api/fine-payments/verify", { reference }),
};
