import { useState } from "react";
import { finesApi, type Fine } from "../../api/fines";
import { usersApi } from "../../api/users";
import { FormField, SubmitButton } from "../../components/AuthLayout";
import { Badge, Banner, Card, EmptyState } from "../../components/DashboardShell";

export default function FinesLookup() {
  const [studentId, setStudentId] = useState("");
  const [fines, setFines] = useState<Fine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookUp(id: string) {
    setError(null);
    setLoading(true);
    try {
      const borrower = await usersApi.getByStudentId(id.trim());
      setFines(await finesApi.getForUser(borrower.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fines.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await lookUp(studentId);
  }

  return (
    <div className="space-y-6">
      <IssueFineForm onIssued={() => studentId && lookUp(studentId)} />
      <Card title="Fines lookup">
        <Banner tone="error" message={error} />
      <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-sm mb-6">
        <div className="flex-1">
          <FormField
            label="Student number"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="mb-4">
          <SubmitButton loading={loading}>Look up</SubmitButton>
        </div>
      </form>

      {fines === null ? (
        <EmptyState>Enter a student number to see their fines.</EmptyState>
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
    </div>
  );
}

function IssueFineForm({ onIssued }: { onIssued: () => void }) {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const amountValue = Number(amount);
    if (!studentId.trim() || Number.isNaN(amountValue) || amountValue <= 0) {
      setError("A student number and a positive amount are required.");
      return;
    }
    setLoading(true);
    try {
      const borrower = await usersApi.getByStudentId(studentId.trim());
      await finesApi.issue({ userId: borrower.id, amount: amountValue, reason: reason.trim() || undefined });
      setSuccess("Fine issued.");
      setAmount("");
      setReason("");
      onIssued();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue fine.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Issue a fine">
      <Banner tone="error" message={error} />
      <Banner tone="success" message={success} />
      <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
        <FormField
          label="Student number"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          disabled={loading}
          required
        />
        <FormField
          label="Amount (GHS)"
          type="number"
          min={0.01}
          step={0.01}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          required
        />
        <FormField
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        />
        <div className="mb-4">
          <SubmitButton loading={loading}>Issue fine</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
