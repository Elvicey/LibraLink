import { api } from "./client";
import type { StaffBook } from "./books";

// Matches Backend entity/Reservation.java on the wire. Book is EAGER, so titles come along.
export interface Reservation {
  id: number;
  userId: number;
  schoolId: number;
  book: StaffBook;
  status: "PENDING" | "READY" | "COLLECTED" | "CANCELLED" | "EXPIRED";
  reservedAt: string;
  readyAt: string | null;
  expiresAt: string | null;
  collectedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  queuePosition: number | null;
  notes: string | null;
}

export const reservationsApi = {
  // STAFF-only, school-scoped (PLATFORM_SUPER_ADMIN sees all) via ReservationService.
  list: () => api.get<Reservation[]>("/api/reservations"),

  // Ownership/staff check happens server-side in ReservationService.
  cancel: (id: number) => api.put<Reservation>(`/api/reservations/${id}/cancel`),
};
