import { api } from "./api";

export interface ReservationResponse {
  id: number;
  userId: number;
  status?: string;
  book?: { id: number; title?: string };
  notes?: string;
}

export interface PickupSlotResponse {
  id: number;
  userId: number;
  reservationId: number;
  qrCode?: string;
  status?: string;
  slotStart?: string;
  slotEnd?: string;
  scheduledAt?: string;
}

function nextDayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function toLocalIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Map UI time labels to a next-day slot window. */
export function slotWindowFromLabel(timeLabel: string): { slotStart: string; slotEnd: string } {
  const lower = timeLabel.toLowerCase();
  let startHour = 9;
  let endHour = 11;
  if (lower.includes("12") || lower.includes("1 pm") || lower.includes("01:00")) {
    startHour = 12;
    endHour = 14;
  } else if (lower.includes("3 pm") || lower.includes("15") || lower.includes("03:00")) {
    startHour = 15;
    endHour = 17;
  } else if (lower.includes("10") || lower.includes("11:00")) {
    startHour = 10;
    endHour = 12;
  } else if (lower.includes("11:00") || lower.includes("01:00 pm")) {
    startHour = 11;
    endHour = 13;
  }
  return {
    slotStart: toLocalIso(nextDayAt(startHour)),
    slotEnd: toLocalIso(nextDayAt(endHour)),
  };
}

export const reservationsService = {
  create: (userId: number, bookId: number, notes?: string) =>
    api.post<ReservationResponse>("/api/reservations", {
      userId,
      book: { id: bookId },
      notes: notes || null,
    }),

  cancel: (id: number) => api.put<ReservationResponse>(`/api/reservations/${id}/cancel`),

  schedulePickup: (payload: {
    userId: number;
    reservationId: number;
    slotStart: string;
    slotEnd: string;
  }) =>
    api.post<PickupSlotResponse>("/api/pickup-slots", {
      userId: payload.userId,
      reservationId: payload.reservationId,
      slotStart: payload.slotStart,
      slotEnd: payload.slotEnd,
    }),

  getPickupsForUser: (userId: number) =>
    api.get<PickupSlotResponse[]>(`/api/pickup-slots/user/${userId}`),
};
