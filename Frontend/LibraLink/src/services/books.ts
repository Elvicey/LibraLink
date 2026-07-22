import { api } from "./api";

export interface BookAuthor {
  id?: number;
  fullName?: string;
}

export interface Book {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  isbn?: string | null;
  language?: string | null;
  availableCopies?: number;
  totalCopies?: number;
  coverImageUrl?: string | null;
  authors?: BookAuthor[];
  active?: boolean;
}

export function bookAuthorName(book: Book): string {
  const names = (book.authors || [])
    .map((a) => a.fullName)
    .filter(Boolean) as string[];
  return names.length ? names.join(", ") : "Unknown author";
}

export function isBookAvailable(book: Book): boolean {
  return (book.availableCopies ?? 0) > 0;
}

export const booksService = {
  list: (): Promise<Book[]> => api.get<Book[]>("/api/books", { auth: false }),

  search: (q: string): Promise<Book[]> =>
    api.get<Book[]>(`/api/books/search?q=${encodeURIComponent(q)}`, { auth: false }),

  getById: (id: number): Promise<Book> =>
    api.get<Book>(`/api/books/${id}`, { auth: false }),
};
