import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { staffApi } from "../../api/staff";
import { usersApi, type StaffUser } from "../../api/users";
import { Badge, Banner, Card, CodeReveal, EmptyState } from "../../components/DashboardShell";

export default function LibrarianManagement() {
  const [librarians, setLibrarians] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  function loadLibrarians() {
    setLoading(true);
    usersApi
      .list()
      .then((users) => setLibrarians(users.filter((u) => u.roles.some((r) => r.name === "LIBRARIAN"))))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load librarians."))
      .finally(() => setLoading(false));
  }

  useEffect(loadLibrarians, []);

  async function handleIssueCode() {
    setError(null);
    setIssuing(true);
    try {
      const result = await staffApi.issueLibrarianCode();
      setCode(result.librarianCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue librarian code.");
    } finally {
      setIssuing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card
        title="Add a librarian"
        action={
          <button
            onClick={handleIssueCode}
            disabled={issuing}
            className="rounded-lg bg-primary text-white text-sm font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-60"
          >
            {issuing ? "Issuing…" : "Issue librarian code"}
          </button>
        }
      >
        <Banner tone="error" message={error} />
        <p className="text-sm text-slate-500 mb-3">
          Issue a single-use librarian code, then register the librarian's account with it.
        </p>
        {code && (
          <div className="mb-4">
            <CodeReveal label="Librarian code" code={code} hint="Single-use, no expiry - enter it on the registration form." />
          </div>
        )}
        <Link to="/librarian-signup" className="text-primary text-sm font-medium hover:underline">
          Register a librarian with a code →
        </Link>
      </Card>

      <Card title="Librarians at your school">
        {loading ? (
          <EmptyState>Loading librarians…</EmptyState>
        ) : librarians.length === 0 ? (
          <EmptyState>No librarians registered yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {librarians.map((librarian) => (
                  <tr key={librarian.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-ink">
                      {librarian.firstName} {librarian.lastName}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{librarian.email}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={librarian.active ? "green" : "red"}>
                        {librarian.active ? "Active" : "Inactive"}
                      </Badge>
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
