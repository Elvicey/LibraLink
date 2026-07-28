import { useEffect, useState } from "react";
import { booksApi, type StaffBook } from "../../api/books";
import { circulationApi, type BorrowRecord } from "../../api/circulation";
import { Banner, Card, StatTile } from "../../components/DashboardShell";

export default function Reports() {
  const [books, setBooks] = useState<StaffBook[]>([]);
  const [loans, setLoans] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([booksApi.list(), circulationApi.listBorrowRecords()])
      .then(([b, l]) => {
        setBooks(b);
        setLoans(l);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load report data."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleRunOverdueCheck() {
    setError(null);
    setCheckResult(null);
    setChecking(true);
    try {
      const result = await circulationApi.runOverdueCheck();
      setCheckResult(`Overdue check complete — ${result.processed} loan(s) flagged.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run overdue check.");
    } finally {
      setChecking(false);
    }
  }

  const availableCount = books.filter((b) => b.availableCopies > 0).length;
  const activeLoans = loans.filter((l) => ["BORROWED", "RENEWED", "OVERDUE"].includes(l.status)).length;
  const overdueLoans = loans.filter((l) => l.status === "OVERDUE").length;

  return (
    <div className="space-y-6">
      <Banner tone="error" message={error} />
      <Banner tone="success" message={checkResult} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Catalogue" value={loading ? "…" : books.length} />
        <StatTile label="Available now" value={loading ? "…" : availableCount} />
        <StatTile label="Active loans" value={loading ? "…" : activeLoans} />
        <StatTile label="Overdue loans" value={loading ? "…" : overdueLoans} />
      </div>

      <Card title="Overdue check">
        <p className="text-sm text-slate-500 mb-4">
          Normally runs automatically every night. Trigger it now to flag past-due loans and grow their
          fines immediately, e.g. right before a payment reconciliation or a report.
        </p>
        <button
          onClick={handleRunOverdueCheck}
          disabled={checking}
          className="rounded-lg bg-primary text-white text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-60"
        >
          {checking ? "Running…" : "Run overdue check now"}
        </button>
      </Card>
    </div>
  );
}
