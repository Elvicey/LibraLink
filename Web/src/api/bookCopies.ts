import { api } from "./client";

// Matches Backend entity/BookCopy.java on the wire. Jackson strips the "is" prefix from
// isAvailable(), so the JSON key is "available" (same convention as Book's "active"/"digitalOnly").
export interface BookCopy {
  id: number;
  book: { id: number };
  schoolId: number;
  barcode: string | null;
  condition: string;
  available: boolean;
  notes: string | null;
  acquiredAt: string | null;
}

export interface BookCopyPayload {
  book: { id: number };
  barcode: string;
  condition?: string;
  notes?: string;
  acquiredAt?: string;
}

export const bookCopiesApi = {
  // STAFF-only, school-scoped for non-platform callers (GET /api/book-copies). No
  // book-scoped endpoint exists server-side, so callers filter this client-side by book id.
  list: () => api.get<BookCopy[]>("/api/book-copies"),

  // STAFF-only (POST /api/book-copies). Registers the barcode CirculationScan's
  // check-out/check-in flow looks up - a Book's totalCopies is just an aggregate count,
  // it does not itself create anything scannable.
  create: (payload: BookCopyPayload) => api.post<BookCopy>("/api/book-copies", payload),
};
