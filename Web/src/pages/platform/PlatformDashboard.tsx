import { useEffect, useMemo, useState } from "react";
import { BarChart3, BookCopy, Building2, History, School, Users, X } from "lucide-react";
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
import AuditLogViewer from "./AuditLogViewer";

type Tab = "schools" | "reports" | "audit";

const NAV: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "schools", label: "Schools", icon: Building2 },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "audit", label: "Audit Log", icon: History },
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
  {
    question: "What does the Audit Log tab show?",
    answer:
      "The 1000 most recent recorded staff actions across every school, newest first — logins, book/role changes, and more. Filter by an exact action name (e.g. \"LOGIN\") to narrow it down.",
  },
  {
    question: "What does a school's email domain do?",
    answer:
      "If set, only students with an email ending in that domain (e.g. \"knust.edu.gh\") can self-register for that school. Leave blank to allow any email — the default for every school until you set one.",
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
  const [editingDomainFor, setEditingDomainFor] = useState<SchoolResponse | null>(null);

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
      pageTitle={tab === "schools" ? "Schools Directory" : tab === "reports" ? "Reports Dashboard" : "Audit Log"}
      pageSubtitle={
        tab === "schools"
          ? "Manage and monitor every school on the LibraLink platform"
          : tab === "reports"
            ? "Circulation activity across every school on the platform"
            : "Recent staff activity across every school on the platform"
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
      ) : tab === "audit" ? (
        <AuditLogViewer />
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

          {editingDomainFor && (
            <EditSchoolDomainModal
              school={editingDomainFor}
              onClose={() => setEditingDomainFor(null)}
              onSaved={() => {
                setEditingDomainFor(null);
                loadSchools();
              }}
            />
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
                      <th className="py-2 pr-4 font-medium">Email domain</th>
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
                        <td className="py-3 pr-4">
                          {school.emailDomain ? (
                            <span className="font-mono text-xs text-ink">{school.emailDomain}</span>
                          ) : (
                            <span className="text-xs text-slate-400">Not set</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">{school.userCount}</td>
                        <td className="py-3 pr-4">{school.bookCount}</td>
                        <td className="py-3 pr-4">{school.schoolAdminCount}</td>
                        <td className="py-3 pr-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => setEditingDomainFor(school)}
                            className="text-primary text-xs font-medium hover:underline"
                          >
                            Edit domain
                          </button>
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
  const [emailDomain, setEmailDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await schoolsApi.create({
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        city: city.trim() || undefined,
        emailDomain: emailDomain.trim() || undefined,
      });
      setName("");
      setShortName("");
      setCity("");
      setEmailDomain("");
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <FormField label="School name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required />
        <FormField label="Short name" value={shortName} onChange={(e) => setShortName(e.target.value)} disabled={loading} />
        <FormField label="City" value={city} onChange={(e) => setCity(e.target.value)} disabled={loading} />
        <FormField
          label="Email domain (optional)"
          placeholder="knust.edu.gh"
          value={emailDomain}
          onChange={(e) => setEmailDomain(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="max-w-xs">
        <SubmitButton loading={loading}>Create school</SubmitButton>
      </div>
    </form>
  );
}

/** Narrowly scoped to just the email domain - not a general "edit school" form, since no
 *  other field (name/city/etc.) is editable after creation today. */
function EditSchoolDomainModal({
  school,
  onClose,
  onSaved,
}: {
  school: SchoolResponse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [domain, setDomain] = useState(school.emailDomain ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await schoolsApi.update(school.id, { emailDomain: domain.trim() });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update email domain.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit email domain for ${school.name}`}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-ink">Email domain — {school.name}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          <Banner tone="error" message={error} />
          <p className="text-sm text-slate-500 mb-4">
            If set, only students with an email ending in this domain can self-register for this
            school. Leave blank to allow any email.
          </p>
          <FormField
            label="Email domain"
            placeholder="knust.edu.gh"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-3 max-w-xs">
            <SubmitButton loading={loading}>Save</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
