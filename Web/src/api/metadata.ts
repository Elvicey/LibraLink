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

// All three are public GETs (permitAll in SecurityConfig) - staff-only for the
// corresponding POST, but we only need read access here for the book form's dropdowns.
export const metadataApi = {
  listAuthors: () => api.get<Author[]>("/api/authors"),
  listPublishers: () => api.get<Publisher[]>("/api/publishers"),
  listCategories: () => api.get<Category[]>("/api/categories"),
};
