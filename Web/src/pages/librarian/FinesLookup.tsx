import { useState } from "react";
import { finesApi, type Fine } from "../../api/fines";
import { FormField, SubmitButton } from "../../components/AuthLayout";
import { Badge, Banner, Card, EmptyState } from "../../components/DashboardShell";

export default function FinesLookup() {
  const [userId, setUserId] = useState("");
  const [fines, setFines] = useState<Fine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      setFines(await finesApi.getForUser(Number(userId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fines.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Fines lookup">
      <Banner tone="error" message={error} />
      <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-sm mb-6">
        <div className="flex-1">
          <FormField
            label="User ID"
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="mb-4">
          <SubmitButton loading={loading}>Look up</SubmitButton>
        </div>
      </form>

      {fines === null ? (
        <EmptyState>Enter a user ID to see their fines.</EmptyState>
      ) : fines.length === 0 ? (
        <EmptyState>No fines for this user.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
                <th className="py-2 pr-4 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {fines.map((fine) => (
                <tr key={fine.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4 font-medium text-ink">GHS {fine.amount.toFixed(2)}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={fine.status === "PAID" ? "green" : "amber"}>{fine.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{fine.reason || "—"}</td>
                  <td className="py-3 pr-4 text-slate-500">
                    {fine.dueDate ? new Date(fine.dueDate).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
