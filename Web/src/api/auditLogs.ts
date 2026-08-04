import { api } from "./client";

// Matches Backend entity/AuditLog.java on the wire.
export interface AuditLog {
  id: number;
  userId: number | null;
  schoolId: number;
  action: string;
  entityType: string | null;
  entityId: number | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export const auditLogsApi = {
  // STAFF-only, school-scoped for non-platform callers (PLATFORM_SUPER_ADMIN sees every
  // school) via AuditLogService. Capped server-side at the 1000 most recent rows.
  listRecent: () => api.get<AuditLog[]>("/api/audit-logs/recent"),

  // Same scoping, filtered to one action name (e.g. "LOGIN", "BOOK_CREATED").
  listByAction: (action: string) => api.get<AuditLog[]>(`/api/audit-logs/action/${encodeURIComponent(action)}`),
};
