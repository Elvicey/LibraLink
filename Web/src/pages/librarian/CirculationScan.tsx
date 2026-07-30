import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ScanBarcode } from "lucide-react";
import { circulationApi, type BorrowRecord } from "../../api/circulation";
import { usersApi } from "../../api/users";
import { FormField, SubmitButton } from "../../components/AuthLayout";
import { Banner, Card, StatCard } from "../../components/DashboardShell";

function isToday(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  );
}

export default function CirculationScan() {
  const [barcode, setBarcode] = useState("");
  const [action, setAction] = useState<"CHECK_OUT" | "CHECK_IN">("CHECK_OUT");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [records, setRecords] = useState<BorrowRecord[]>([]);

  function loadRecords() {
    circulationApi
      .listBorrowRecords()
      .then(setRecords)
      .catch(() => {
        // Quick stats/activity are a bonus view - the scan form above still works if this fails.
      });
  }

  useEffect(loadRecords, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      let userId: number | undefined;
      if (action === "CHECK_OUT") {
        const borrower = await usersApi.getByStudentId(studentId.trim());
        userId = borrower.id;
      }
      const response = await circulationApi.scan(barcode.trim(), action, userId);
      setResult(
        action === "CHECK_OUT"
          ? `Checked out. Due back ${response.dueDate}.`
          : "Checked in successfully."
      );
      setBarcode("");
      setStudentId("");
      loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }

  const todaysCheckouts = records.filter((r) => isToday(r.borrowedAt)).length;
  const todaysReturns = records.filter((r) => isToday(r.returnedAt)).length;

  const recentActivity = [...records]
    .flatMap((r) => {
      const events: { at: string; kind: "out" | "in"; record: BorrowRecord }[] = [
        { at: r.borrowedAt, kind: "out" as const, record: r },
      ];
      if (r.returnedAt) events.push({ at: r.returnedAt, kind: "in" as const, record: r });
      return events;
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6);

  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
      <Card title="Checkout scan">
        <Banner tone="error" message={error} />
        {result && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2">
            {result}
          </div>
        )}
        <form onSubmit={handleSubmit} className="max-w-sm">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setAction("CHECK_OUT")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                action === "CHECK_OUT" ? "border-primary bg-primary/10 text-primary" : "border-slate-300 text-slate-600"
              }`}
            >
              Check out
            </button>
            <button
              type="button"
              onClick={() => setAction("CHECK_IN")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                action === "CHECK_IN" ? "border-primary bg-primary/10 text-primary" : "border-slate-300 text-slate-600"
              }`}
            >
              Check in
            </button>
          </div>
          <FormField
            label="Barcode"
            icon={ScanBarcode}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            disabled={loading}
            required
          />
          {action === "CHECK_OUT" && (
            <FormField
              label="Borrower's student number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={loading}
              required
            />
          )}
          <SubmitButton loading={loading}>{action === "CHECK_OUT" ? "Check out" : "Check in"}</SubmitButton>
        </form>
      </Card>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Today's checkouts" value={todaysCheckouts} icon={ArrowUpRight} tone="primary" />
          <StatCard label="Today's returns" value={todaysReturns} icon={ArrowDownLeft} tone="success" />
        </div>

        <Card title="Recent activity">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No circulation activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((event, i) => (
                <li key={`${event.record.id}-${event.kind}-${i}`} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                      event.kind === "out" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                    }`}
                  >
                    {event.kind === "out" ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="text-ink font-medium truncate">
                      {event.record.user ? `${event.record.user.firstName} ${event.record.user.lastName}` : "Unknown"}{" "}
                      <span className="text-slate-500 font-normal">
                        {event.kind === "out" ? "checked out" : "returned"} "{event.record.book?.title ?? "a book"}"
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{new Date(event.at).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
