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
};
