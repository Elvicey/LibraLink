import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookMarked, Clock3, ListChecks, RefreshCcw, Search as SearchIcon, TrendingUp } from "lucide-react";
import { booksApi, type StaffBook } from "../api/books";
import { circulationApi, type BorrowRecord } from "../api/circulation";
import { reservationsApi, type Reservation } from "../api/reservations";
import { analyticsApi, type SearchLog } from "../api/analytics";
import { Banner, Card, StatCard } from "./DashboardShell";

const TREND_DAYS = 30;
const PRIMARY = "#2F6FED";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Zero-filled daily counts for the trailing N days, so a quiet day still plots as 0
// rather than vanishing from the axis.
function bucketByDay(timestamps: string[], days: number) {
  const now = new Date();
  const buckets: { key: string; date: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.push({ key: dayKey(d), date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) });
  }
  const counts = new Map(buckets.map((b) => [b.key, 0]));
  for (const ts of timestamps) {
    const key = dayKey(new Date(ts));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return buckets.map((b) => ({ date: b.date, count: counts.get(b.key) ?? 0 }));
}

function truncateLabel(s: string, max = 16) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function topByCount(values: string[], limit: number) {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name: truncateLabel(name), fullName: name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Shared circulation report used by both the School Admin Reports tab (scoped to that
 * school) and the Platform Super Admin Reports tab (every endpoint here already returns
 * cross-school data for a platform caller - see BookService/BorrowRecordService/
 * ReservationService). Search-log analytics are school-only server-side
 * (AnalyticsService.getLogsByDateRange calls SchoolContext.requireSchoolId(), which throws
 * for a platform caller with no school), so `includeSearchAnalytics` must stay false there.
 */
export default function CirculationReport({ includeSearchAnalytics = true }: { includeSearchAnalytics?: boolean }) {
  const [books, setBooks] = useState<StaffBook[]>([]);
  const [loans, setLoans] = useState<BorrowRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - TREND_DAYS);
    from.setHours(0, 0, 0, 0);
    Promise.all([
      booksApi.list(),
      circulationApi.listBorrowRecords(),
      reservationsApi.list(),
      includeSearchAnalytics
        ? analyticsApi.searchLogsByDateRange(dayKey(from) + "T00:00:00", dayKey(now) + "T23:59:59")
        : Promise.resolve<SearchLog[]>([]),
    ])
      .then(([b, l, r, s]) => {
        setBooks(b);
        setLoans(l);
        setReservations(r);
        setSearchLogs(s);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load report data."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [includeSearchAnalytics]);

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
  const pendingReservations = reservations.filter((r) => r.status === "PENDING" || r.status === "READY").length;

  const loansOverTime = bucketByDay(loans.map((l) => l.borrowedAt), TREND_DAYS);
  const searchesOverTime = bucketByDay(searchLogs.map((s) => s.createdAt), TREND_DAYS);
  const topBooks = topByCount(loans.map((l) => l.book?.title ?? "Unknown"), 8);
  const topQueries = topByCount(searchLogs.map((s) => s.query), 8);

  return (
    <div className="space-y-6">
      <Banner tone="error" message={error} />
      <Banner tone="success" message={checkResult} />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Catalogue" value={loading ? "…" : books.length} icon={BookMarked} tone="primary" />
        <StatCard label="Available now" value={loading ? "…" : availableCount} icon={ListChecks} tone="success" />
        <StatCard label="Active loans" value={loading ? "…" : activeLoans} icon={TrendingUp} tone="primary" />
        <StatCard label="Overdue loans" value={loading ? "…" : overdueLoans} icon={Clock3} tone="danger" />
        <StatCard
          label="Pending reservations"
          value={loading ? "…" : pendingReservations}
          icon={RefreshCcw}
          tone="warning"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title={`Circulation trends — loans, last ${TREND_DAYS} days`}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loansOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  labelStyle={{ color: "#0F172A", fontWeight: 600 }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="count" name="Loans" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {includeSearchAnalytics && (
          <Card title={`Searches, last ${TREND_DAYS} days`}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={searchesOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    labelStyle={{ color: "#0F172A", fontWeight: 600 }}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar dataKey="count" name="Searches" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card title="Top borrowed books">
          {topBooks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No loans recorded yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topBooks}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 4, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#0F172A" }}
                    tickLine={false}
                    axisLine={false}
                    width={150}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    cursor={{ fill: "#f8fafc" }}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName ?? _label}
                  />
                  <Bar dataKey="count" name="Loans" fill={PRIMARY} radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {includeSearchAnalytics && (
          <Card
            title={
              <span className="flex items-center gap-1.5">
                <SearchIcon className="h-4 w-4 text-slate-400" /> Top searches
              </span>
            }
          >
            {topQueries.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No searches logged in this window.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="py-2 pr-4 font-medium">Query</th>
                      <th className="py-2 pr-4 font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topQueries.map((q) => (
                      <tr key={q.name} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 pr-4 text-ink">{q.name}</td>
                        <td className="py-2 pr-4 text-slate-500">{q.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      <Card title="Overdue check">
        <p className="text-sm text-slate-500 mb-4">
          Normally runs automatically every night, across every school. Trigger it now to flag
          past-due loans and grow their fines immediately, e.g. right before a payment reconciliation
          or a report.
        </p>
        <button
          onClick={handleRunOverdueCheck}
          disabled={checking}
          className="rounded-lg bg-primary text-white text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-60"
        >
          {checking ? "Running…" : "Run overdue check now"}
        </button>
      </Card>

      <Card title="Export data">
        <p className="text-sm text-slate-500 mb-4">Download the current loan and reservation lists as CSV.</p>
        <div className="flex gap-3">
          <button
            onClick={() =>
              downloadCsv(
                "loans.csv",
                loans.map((l) => ({
                  id: l.id,
                  book: l.book?.title ?? "",
                  borrower: l.user ? `${l.user.firstName} ${l.user.lastName}` : "",
                  status: l.status,
                  borrowedAt: l.borrowedAt,
                  dueDate: l.dueDate,
                  returnedAt: l.returnedAt ?? "",
                }))
              )
            }
            disabled={loans.length === 0}
            className="rounded-lg border border-slate-300 text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            Export loans CSV
          </button>
          <button
            onClick={() =>
              downloadCsv(
                "reservations.csv",
                reservations.map((r) => ({
                  id: r.id,
                  book: r.book.title,
                  userId: r.userId,
                  status: r.status,
                  reservedAt: r.reservedAt,
                  queuePosition: r.queuePosition ?? "",
                }))
              )
            }
            disabled={reservations.length === 0}
            className="rounded-lg border border-slate-300 text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            Export reservations CSV
          </button>
        </div>
      </Card>
    </div>
  );
}
