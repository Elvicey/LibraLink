import { api } from "./client";
import type { StaffBook } from "./books";

export interface BorrowRecordUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Matches Backend entity/BorrowRecord.java on the wire.
export interface BorrowRecord {
  id: number;
  user: BorrowRecordUser | null;
  book: StaffBook;
  status: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  renewalCount: number;
}

export interface ScanResult {
  message: string;
  barcode: string;
  action: "CHECK_OUT" | "CHECK_IN";
  dueDate?: string;
}

export const circulationApi = {
  // STAFF-only, school-scoped (PLATFORM_SUPER_ADMIN sees all) via BorrowRecordService.
  listBorrowRecords: () => api.get<BorrowRecord[]>("/api/borrow-records"),

  scan: (barcode: string, action: "CHECK_OUT" | "CHECK_IN", userId?: number) =>
    api.post<ScanResult>("/api/circulation/scan", { barcode, action, userId }),
};
