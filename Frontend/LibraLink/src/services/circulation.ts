import { api } from "./api";

export interface BookCopyResponse {
  id: number;
  barcode?: string;
  available?: boolean;
  book?: { id: number; title?: string } | null;
}

export type ScanAction = "CHECK_OUT" | "CHECK_IN";

export interface ScanResult {
  message: string;
  barcode: string;
  action: ScanAction;
  dueDate?: string;
}

/**
 * Front-desk circulation, staff-only (LIBRARIAN/ADMIN). `lookup` resolves a scanned
 * barcode to its copy so the UI can confirm the title before committing a check-out/in.
 */
export const circulationService = {
  lookup: (barcode: string): Promise<BookCopyResponse> =>
    api.get<BookCopyResponse>(`/api/book-copies/barcode/${encodeURIComponent(barcode)}`),

  scan: (barcode: string, action: ScanAction, userId?: number): Promise<ScanResult> =>
    api.post<ScanResult>("/api/circulation/scan", { barcode, action, userId }),
};
