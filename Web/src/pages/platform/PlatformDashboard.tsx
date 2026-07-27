import { useEffect, useState } from "react";
import { schoolsApi, type SchoolCodeResponse, type SchoolResponse } from "../../api/schools";
import { Badge, Banner, Card, CodeReveal, DashboardShell, EmptyState, StatTile } from "../../components/DashboardShell";
import { FormField, SubmitButton } from "../../components/AuthLayout";

export default function PlatformDashboard() {
  const [schools, setSchools] = useState<SchoolResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedCode, setRevealedCode] = useState<SchoolCodeResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

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

  return (
    <DashboardShell title="Platform Super Admin" subtitle="Cross-school oversight">
      <Banner tone="error" message={error} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatTile label="Schools" value={schools.length} />
        <StatTile label="Active schools" value={activeCount} />
        <StatTile label="Total users" value={totalUsers} />
        <StatTile label="Total books" value={totalBooks} />
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

      <Card
        title="Schools"
        action={
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-lg bg-primary text-white text-sm font-semibold px-3 py-1.5 hover:opacity-90"
          >
            {showCreate ? "Cancel" : "+ New school"}
          </button>
        }
      >
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
                {schools.map((school) => (
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
          </div>
        )}
      </Card>
    </DashboardShell>
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
