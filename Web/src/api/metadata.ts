import { api } from "./client";

export interface Author {
  id: number;
  fullName: string;
}

export interface Publisher {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

// All three GETs are public (permitAll in SecurityConfig) - staff-only for the
// corresponding POSTs. createCategory lets the book form add a category inline instead of
// leaving every book's category unset with no way to define one from the UI.
export const metadataApi = {
  listAuthors: () => api.get<Author[]>("/api/authors"),
  listPublishers: () => api.get<Publisher[]>("/api/publishers"),
  listCategories: () => api.get<Category[]>("/api/categories"),
  createCategory: (name: string) => api.post<Category>("/api/categories", { name }),
};
