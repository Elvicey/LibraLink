import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { auditLogsApi, type AuditLog } from "../../api/auditLogs";
import { schoolsApi } from "../../api/schools";
import { Badge, Banner, Card, EmptyState, PaginationFooter, usePagination } from "../../components/DashboardShell";

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [schoolNames, setSchoolNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");

  function load(action?: string) {
    setLoading(true);
    setError(null);
    const request = action ? auditLogsApi.listByAction(action) : auditLogsApi.listRecent();
    request
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load audit logs."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    schoolsApi
      .list()
      .then((schools) => {
        setSchoolNames(Object.fromEntries(schools.map((s) => [s.id, s.shortName || s.name])));
      })
      .catch(() => {
        // School names are a display nicety - the school id still shows if this fails.
      });
  }, []);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    load(actionFilter.trim() || undefined);
  }

  const { page, setPage, totalPages, pageItems, pageSize, total } = usePagination(logs, 20);

  return (
    <Card title="Audit log">
      <Banner tone="error" message={error} />
      <p className="text-sm text-slate-500 mb-4">
        The {logs.length >= 1000 ? "1000 " : ""}most recent recorded actions across every school, newest
        first. Filter by an exact action name (e.g. "LOGIN") to narrow it down.
      </p>

      <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <SearchIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by action (e.g. LOGIN)…"
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary text-white text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-60"
        >
          {actionFilter.trim() ? "Filter" : "Refresh"}
        </button>
        {actionFilter.trim() && (
          <button
            type="button"
            onClick={() => {
              setActionFilter("");
              load();
            }}
            disabled={loading}
            className="rounded-lg border border-slate-300 text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <EmptyState>Loading audit log…</EmptyState>
      ) : logs.length === 0 ? (
        <EmptyState>No audit log entries{actionFilter.trim() ? ` for "${actionFilter.trim()}"` : ""}.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">School</th>
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Action</th>
                <th className="py-2 pr-4 font-medium">Entity</th>
                <th className="py-2 pr-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone="slate">{schoolNames[log.schoolId] ?? `#${log.schoolId}`}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{log.userId ?? "—"}</td>
                  <td className="py-3 pr-4 font-medium text-ink">{log.action}</td>
                  <td className="py-3 pr-4 text-slate-500">
                    {log.entityType ? `${log.entityType}${log.entityId ? ` #${log.entityId}` : ""}` : "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-500 max-w-xs truncate" title={log.details ?? undefined}>
                    {log.details || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationFooter page={page} totalPages={totalPages} onChange={setPage} total={total} pageSize={pageSize} />
        </div>
      )}
    </Card>
  );
}
