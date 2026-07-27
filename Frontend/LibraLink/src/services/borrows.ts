import { api } from "./api";
import { Book } from "./books";

export interface BorrowRecord {
  id: number;
  status: string;
  borrowedAt?: string;
  dueDate?: string;
  returnedAt?: string | null;
  renewalCount?: number;
  book?: Book;
  notes?: string | null;
}

export const borrowsService = {
  getCurrent: (userId: number): Promise<BorrowRecord[]> =>
    api.get<BorrowRecord[]>(`/api/borrow-records/user/${userId}/current`),

  getHistory: (userId: number): Promise<BorrowRecord[]> =>
    api.get<BorrowRecord[]>(`/api/borrow-records/user/${userId}`),

  /** Extend the loan by another period (self-service). */
  renew: (recordId: number): Promise<BorrowRecord> =>
    api.put<BorrowRecord>(`/api/borrow-records/${recordId}/renew`),

  /** Return a loan by record id (self-service / in-app). */
  return: (recordId: number): Promise<BorrowRecord> =>
    api.put<BorrowRecord>(`/api/borrow-records/${recordId}/return`),

  /** Run the overdue check now (librarian/admin): flag past-due loans and grow their fines. */
  runOverdueCheck: (): Promise<{ processed: number }> =>
    api.post<{ processed: number }>(`/api/borrow-records/run-overdue-check`),
};
