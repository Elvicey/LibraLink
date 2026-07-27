import { api } from "./client";

export interface BookAuthor {
  id: number;
  fullName: string;
}

// Matches Backend entity/Book.java on the wire. Note: Jackson strips the "is" prefix
// from isDigitalOnly()/isActive() getters, so the JSON keys are "digitalOnly"/"active".
export interface StaffBook {
  id: number;
  title: string;
  subtitle: string | null;
  isbn: string | null;
  isbn13: string | null;
  edition: string | null;
  language: string | null;
  totalCopies: number;
  availableCopies: number;
  digitalOnly: boolean;
  active: boolean;
  authors: BookAuthor[];
}

export const booksApi = {
  // Authenticated + school-scoped for non-platform callers (GET /api/books).
  list: () => api.get<StaffBook[]>("/api/books"),

  search: (q: string) => api.get<StaffBook[]>(`/api/books/search?q=${encodeURIComponent(q)}`),
};
