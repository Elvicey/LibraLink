import { api } from "./client";

// Matches Backend entity/SearchLog.java on the wire.
export interface SearchLog {
  id: number;
  userId: number | null;
  schoolId: number;
  query: string;
  resultsCount: number | null;
  searchType: string | null;
  createdAt: string;
}

export const analyticsApi = {
  // STAFF-only, school-scoped (PLATFORM_SUPER_ADMIN sees all). `from`/`to` are ISO
  // local-date-time strings, e.g. `2026-07-01T00:00:00`.
  searchLogsByDateRange: (from: string, to: string) =>
    api.get<SearchLog[]>(`/api/analytics/search-logs/date-range?from=${from}&to=${to}`),

  searchLogsByType: (searchType: string) =>
    api.get<SearchLog[]>(`/api/analytics/search-logs/type/${encodeURIComponent(searchType)}`),
};
