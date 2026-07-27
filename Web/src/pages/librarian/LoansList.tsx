import { useEffect, useState } from "react";
import { circulationApi, type BorrowRecord } from "../../api/circulation";
import { Badge, Banner, Card, EmptyState } from "../../components/DashboardShell";

const STATUS_TONE: Record<string, "green" | "red" | "slate" | "amber"> = {
  BORROWED: "amber",
  RENEWED: "amber",
  RETURNED: "green",
  OVERDUE: "red",
  LOST: "red",
};

export default function LoansList() {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    circulationApi
      .listBorrowRecords()
      .then((records) => setRecords(records.sort((a, b) => b.id - a.id)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load loans."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="Loans">
      <Banner tone="error" message={error} />
      {loading ? (
        <EmptyState>Loading loans…</EmptyState>
      ) : records.length === 0 ? (
        <EmptyState>No loans recorded yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Book</th>
                <th className="py-2 pr-4 font-medium">Borrower</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Due</th>
                <th className="py-2 pr-4 font-medium">Returned</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4 font-medium text-ink">{record.book?.title ?? "—"}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {record.user ? `${record.user.firstName} ${record.user.lastName}` : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={STATUS_TONE[record.status] ?? "slate"}>{record.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-slate-500">{record.dueDate}</td>
                  <td className="py-3 pr-4 text-slate-500">
                    {record.returnedAt ? new Date(record.returnedAt).toLocaleDateString() : "—"}
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
