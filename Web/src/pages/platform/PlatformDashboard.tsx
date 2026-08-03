import { useEffect, useMemo, useState } from "react";
import { BarChart3, BookCopy, Building2, School, Users } from "lucide-react";
import { schoolsApi, type SchoolCodeResponse, type SchoolResponse } from "../../api/schools";
import {
  AppShell,
  Badge,
  Banner,
  Card,
  CodeReveal,
  EmptyState,
  PaginationFooter,
  StatCard,
  usePagination,
  type HelpTopic,
} from "../../components/DashboardShell";
import { FormField, SubmitButton } from "../../components/AuthLayout";
import CirculationReport from "../../components/CirculationReport";

type Tab = "schools" | "reports";

const NAV: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "schools", label: "Schools", icon: Building2 },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

const HELP_TOPICS: HelpTopic[] = [
  {
    question: "How do I add a new school?",
    answer:
      "Click \"+ Create school\", fill in its name, then share the generated school code with their first School Admin so they can sign up.",
  },
  {
    question: "How do I suspend or reactivate a school?",
    answer: "Use the Suspend / Reactivate action in the schools table for that row.",
  },
  {
    question: "How do I regenerate a school's signup code?",
    answer: "Click \"Regenerate code\" next to that school — the previous code stops working once a new one is issued.",
  },
  {
    question: "What does the Reports tab show?",
    answer:
      "Circulation activity across every school on the platform — catalogue size, active/overdue loans, pending reservations, and the top borrowed titles. Search analytics are school-specific, so they're not included here.",
  },
];

export default function PlatformDashboard() {
  const [tab, setTab] = useState<Tab>("schools");
  const [schools, setSchools] = useState<SchoolResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedCode, setRevealedCode] = useState<SchoolCodeResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");

  async function loadSchools() {
    setLoading(true);
    setError(null);
    try {
      setSchools(await schoolsApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schools.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchools();
  }, []);

  async function handleSetStatus(school: SchoolResponse, status: "ACTIVE" | "SUSPENDED") {
    setError(null);
    try {
      await schoolsApi.update(school.id, { status });
      await loadSchools();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update school.");
    }
  }

  async function handleRegenerateCode(school: SchoolResponse) {
    setError(null);
    try {
      const result = (await schoolsApi.update(school.id, { regenerateCode: true })) as SchoolCodeResponse;
      setRevealedCode(result);
      await loadSchools();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate code.");
    }
  }

  const totalUsers = schools.reduce((sum, s) => sum + s.userCount, 0);
  const totalBooks = schools.reduce((sum, s) => sum + s.bookCount, 0);
  const activeCount = schools.filter((s) => s.status === "ACTIVE").length;

  const filteredSchools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.shortName ?? "").toLowerCase().includes(q)
    );
  }, [schools, query]);
  const { page, setPage, totalPages, pageItems, pageSize, total } = usePagination(filteredSchools, 8);

  return (
    <AppShell
      portalLabel="Platform Super Admin"
      nav={NAV}
      activeKey={tab}
      onNavigate={(key) => setTab(key as Tab)}
      pageTitle={tab === "schools" ? "Schools Directory" : "Reports Dashboard"}
      pageSubtitle={
        tab === "schools"
          ? "Manage and monitor every school on the LibraLink platform"
          : "Circulation activity across every school on the platform"
      }
      search={tab === "schools" ? { value: query, onChange: setQuery, placeholder: "Search schools…" } : undefined}
      helpTopics={HELP_TOPICS}
      headerAction={
        tab === "schools" ? (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-lg bg-primary text-white text-sm font-semibold px-4 py-2 hover:opacity-90"
          >
            {showCreate ? "Cancel" : "+ Create school"}
          </button>
        ) : undefined
      }
    >
      {tab === "reports" ? (
        <CirculationReport includeSearchAnalytics={false} />
      ) : (
        <>
          <Banner tone="error" message={error} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard label="Schools" value={schools.length} icon={Building2} tone="primary" />
            <StatCard label="Active schools" value={activeCount} icon={School} tone="success" />
            <StatCard label="Total users" value={totalUsers} icon={Users} tone="warning" />
            <StatCard label="Total books" value={totalBooks} icon={BookCopy} tone="primary" />
          </div>

          {revealedCode && (
            <div className="mb-6">
              <CodeReveal
                label={`School code for ${revealedCode.name}`}
                code={revealedCode.schoolCode}
                hint="Give this to the school's first School Admin to sign up with."
              />
            </div>
          )}

          <Card title="Schools">
            {showCreate && (
              <CreateSchoolForm
                onCreated={(result) => {
                  setRevealedCode(result);
                  setShowCreate(false);
                  loadSchools();
                }}
              />
            )}

            {loading ? (
              <EmptyState>Loading schools…</EmptyState>
            ) : schools.length === 0 ? (
              <EmptyState>No schools yet. Create the first one above.</EmptyState>
            ) : filteredSchools.length === 0 ? (
              <EmptyState>No schools match "{query}".</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="py-2 pr-4 font-medium">School</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Code</th>
                      <th className="py-2 pr-4 font-medium">Users</th>
                      <th className="py-2 pr-4 font-medium">Books</th>
                      <th className="py-2 pr-4 font-medium">Admins</th>
                      <th className="py-2 pr-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((school) => (
                      <tr key={school.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-ink">{school.name}</div>
                          {school.shortName && <div className="text-xs text-slate-400">{school.shortName}</div>}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge tone={school.status === "ACTIVE" ? "green" : "red"}>{school.status}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge tone={school.schoolCodePending ? "amber" : "slate"}>
                            {school.schoolCodePending ? "Code pending" : "Redeemed"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">{school.userCount}</td>
                        <td className="py-3 pr-4">{school.bookCount}</td>
                        <td className="py-3 pr-4">{school.schoolAdminCount}</td>
                        <td className="py-3 pr-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleRegenerateCode(school)}
                            className="text-primary text-xs font-medium hover:underline"
                          >
                            Regenerate code
                          </button>
                          {school.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleSetStatus(school, "SUSPENDED")}
                              className="text-red-600 text-xs font-medium hover:underline"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetStatus(school, "ACTIVE")}
                              className="text-emerald-600 text-xs font-medium hover:underline"
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PaginationFooter page={page} totalPages={totalPages} onChange={setPage} total={total} pageSize={pageSize} />
              </div>
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}

function CreateSchoolForm({ onCreated }: { onCreated: (result: SchoolCodeResponse) => void }) {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await schoolsApi.create({ name: name.trim(), shortName: shortName.trim() || undefined, city: city.trim() || undefined });
      setName("");
      setShortName("");
      setCity("");
      onCreated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create school.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
      <Banner tone="error" message={error} />
      <div className="grid sm:grid-cols-3 gap-3">
        <FormField label="School name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required />
        <FormField label="Short name" value={shortName} onChange={(e) => setShortName(e.target.value)} disabled={loading} />
        <FormField label="City" value={city} onChange={(e) => setCity(e.target.value)} disabled={loading} />
      </div>
      <div className="max-w-xs">
        <SubmitButton loading={loading}>Create school</SubmitButton>
      </div>
    </form>
  );
}
