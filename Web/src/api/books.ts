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

// Matches Backend dto/BookRequest.java. institutionId is deliberately omitted - the
// backend always resolves a non-platform staff caller's own school server-side
// (SchoolContext.resolveTargetSchoolId), ignoring any client-supplied value.
export interface BookFormPayload {
  title: string;
  subtitle: string;
  isbn: string;
  isbn13?: string;
  publisherId?: number;
  categoryId?: number;
  publicationYear?: number;
  edition?: string;
  language: string;
  description?: string;
  totalCopies: number;
  availableCopies: number;
  isDigitalOnly: boolean;
  isActive: boolean;
  authorIds: number[];
}

export const booksApi = {
  // Authenticated + school-scoped for non-platform callers (GET /api/books).
  list: () => api.get<StaffBook[]>("/api/books"),

  search: (q: string) => api.get<StaffBook[]>(`/api/books/search?q=${encodeURIComponent(q)}`),

  // Both STAFF-only; school is always server-resolved, never client-supplied.
  create: (payload: BookFormPayload) => api.post<StaffBook>("/api/books", payload),
  update: (id: number, payload: BookFormPayload) => api.put<StaffBook>(`/api/books/${id}`, payload),

  // Full readable text for the in-app reader. GET is public like the other book reads;
  // PUT is LIBRARIAN/ADMIN-only.
  getContent: (id: number) => api.get<{ content: string }>(`/api/books/${id}/content`),
  updateContent: (id: number, content: string) =>
    api.put<{ id: number; hasContent: boolean }>(`/api/books/${id}/content`, { content }),
};
