import { api } from "./client";

// Matches Backend entity/PickupSlot.java on the wire.
export interface PickupSlot {
  id: number;
  userId: number;
  schoolId: number;
  loanId: number | null;
  qrCode: string;
  status: "SCHEDULED" | "COLLECTED";
  reservationId: number;
  scheduledAt: string;
  collectedBy: number | null;
  collectedAt: string | null;
  slotStart: string | null;
  slotEnd: string | null;
}

export const pickupSlotsApi = {
  // STAFF-only, school-scoped.
  listScheduled: () => api.get<PickupSlot[]>("/api/pickup-slots/scheduled"),

  // STAFF-only. Marks the slot COLLECTED and cascades its reservation to COLLECTED too.
  scan: (qrCode: string, librarianId?: number) => {
    const params = new URLSearchParams({ qrCode });
    if (librarianId !== undefined) {
      params.set("librarianId", String(librarianId));
    }
    return api.post<PickupSlot>(`/api/pickup-slots/scan?${params.toString()}`);
  },
};
