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

export function inferSubject(book: Book): string {
  const blob = `${book.subtitle || ""} ${book.description || ""} ${book.title || ""}`.toLowerCase();
  if (blob.includes("subject: science") || /\b(calculus|physics|chemistry|biology)\b/.test(blob)) {
    return "Science";
  }
  if (blob.includes("subject: computing") || /\b(data structure|algorithm|database|software|computer)\b/.test(blob)) {
    return "Computing";
  }
  if (blob.includes("subject: economics") || /\beconomic/.test(blob)) {
    return "Economics";
  }
  if (
    blob.includes("subject: literature") ||
    /\b(things fall apart|purple hibiscus|nervous conditions|novel|literature|achebe|adichie)\b/.test(blob)
  ) {
    return "Literature";
  }
  return "General";
}

export const booksService = {
  list: (): Promise<Book[]> => api.get<Book[]>("/api/books", { auth: false }),

  search: (q: string): Promise<Book[]> =>
    api.get<Book[]>(`/api/books/search?q=${encodeURIComponent(q)}`, { auth: false }),

  getById: (id: number): Promise<Book> =>
    api.get<Book>(`/api/books/${id}`, { auth: false }),
};
