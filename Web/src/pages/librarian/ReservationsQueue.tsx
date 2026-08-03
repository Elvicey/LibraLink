import { useEffect, useState } from "react";
import { reservationsApi, type Reservation } from "../../api/reservations";
import { pickupSlotsApi, type PickupSlot } from "../../api/pickupSlots";
import { usersApi, type StaffUser } from "../../api/users";
import { useAuth } from "../../auth/AuthContext";
import { Badge, Banner, Card, EmptyState } from "../../components/DashboardShell";
import { FormField, SubmitButton } from "../../components/AuthLayout";

const STATUS_TONE: Record<string, "green" | "red" | "slate" | "amber"> = {
  PENDING: "slate",
  READY: "amber",
  COLLECTED: "green",
  CANCELLED: "red",
  EXPIRED: "red",
};

export default function ReservationsQueue() {
  const { userId: librarianId } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qrCode, setQrCode] = useState("");
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [collectResult, setCollectResult] = useState<string | null>(null);

  const [cancellingId, setCancellingId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([reservationsApi.list(), pickupSlotsApi.listScheduled(), usersApi.list()])
      .then(([r, s, u]) => {
        setReservations(r);
        setSlots(s);
        setUsers(u);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load reservations."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const userName = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `User #${userId}`;
  };

  const reservationByBookTitle = (reservationId: number) =>
    reservations.find((r) => r.id === reservationId)?.book.title ?? "—";

  const queue = reservations
    .filter((r) => r.status === "PENDING" || r.status === "READY")
    .sort((a, b) => (a.queuePosition ?? 0) - (b.queuePosition ?? 0));

  async function handleCollect(e: React.FormEvent) {
    e.preventDefault();
    setCollectError(null);
    setCollectResult(null);
    setCollecting(true);
    try {
      await pickupSlotsApi.scan(qrCode.trim(), librarianId ?? undefined);
      setCollectResult("Pickup collected.");
      setQrCode("");
      load();
    } catch (err) {
      setCollectError(err instanceof Error ? err.message : "Failed to collect pickup.");
    } finally {
      setCollecting(false);
    }
  }

  async function handleCancel(id: number) {
    setError(null);
    setCancellingId(id);
    try {
      await reservationsApi.cancel(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel reservation.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Banner tone="error" message={error} />

      <Card title="Collect a pickup">
        <Banner tone="error" message={collectError} />
        {collectResult && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2">
            {collectResult}
          </div>
        )}
        <form onSubmit={handleCollect} className="max-w-sm">
          <FormField
            label="QR code"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            disabled={collecting}
            required
          />
          <SubmitButton loading={collecting}>Collect</SubmitButton>
        </form>
      </Card>

      <Card title="Reservation queue">
        {loading ? (
          <EmptyState>Loading reservations…</EmptyState>
        ) : queue.length === 0 ? (
          <EmptyState>No pending or ready reservations.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">Book</th>
                  <th className="py-2 pr-4 font-medium">Patron</th>
                  <th className="py-2 pr-4 font-medium">Queue #</th>
                  <th className="py-2 pr-4 font-medium">Reserved</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {queue.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-ink">{r.book.title}</td>
                    <td className="py-3 pr-4 text-slate-600">{userName(r.userId)}</td>
                    <td className="py-3 pr-4 text-slate-500">{r.queuePosition ?? "—"}</td>
                    <td className="py-3 pr-4 text-slate-500">
                      {new Date(r.reservedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={STATUS_TONE[r.status] ?? "slate"}>{r.status}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={cancellingId === r.id}
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        {cancellingId === r.id ? "Cancelling…" : "Cancel"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Scheduled pickups">
        {loading ? (
          <EmptyState>Loading pickups…</EmptyState>
        ) : slots.length === 0 ? (
          <EmptyState>No pickups currently scheduled.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">Book</th>
                  <th className="py-2 pr-4 font-medium">Patron</th>
                  <th className="py-2 pr-4 font-medium">Window</th>
                  <th className="py-2 pr-4 font-medium">QR code</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-ink">
                      {reservationByBookTitle(s.reservationId)}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{userName(s.userId)}</td>
                    <td className="py-3 pr-4 text-slate-500">
                      {s.slotStart ? new Date(s.slotStart).toLocaleString() : "—"}
                      {s.slotEnd ? ` – ${new Date(s.slotEnd).toLocaleTimeString()}` : ""}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">{s.qrCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
