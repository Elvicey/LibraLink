import { useEffect, useState } from "react";
import { usersApi, type StaffUser } from "../../api/users";
import { FormField, SubmitButton } from "../../components/AuthLayout";
import { Badge, Banner, Card, EmptyState } from "../../components/DashboardShell";

const ASSIGNABLE_ROLES = ["STUDENT", "LIBRARIAN", "ADMIN"];

export default function UserOversight() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  function loadUsers() {
    setLoading(true);
    usersApi
      .listStaff()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load staff."))
      .finally(() => setLoading(false));
  }

  useEffect(loadUsers, []);

  async function handleAssignRole(userId: number, role: string) {
    setError(null);
    setAssigningId(userId);
    try {
      await usersApi.assignRole(userId, role);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="space-y-6">
      <StudentLookup onRoleGranted={loadUsers} />

      <Card title="Staff">
        <Banner tone="error" message={error} />
        {loading ? (
          <EmptyState>Loading staff…</EmptyState>
        ) : users.length === 0 ? (
          <EmptyState>No staff at your school yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <UserTableHead />
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    assigning={assigningId === user.id}
                    onAssignRole={(role) => handleAssignRole(user.id, role)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StudentLookup({ onRoleGranted }: { onRoleGranted: () => void }) {
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStudent(null);
    setLoading(true);
    try {
      setStudent(await usersApi.getByStudentId(studentId.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No student found with that number.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignRole(role: string) {
    if (!student) return;
    setError(null);
    setAssigning(true);
    try {
      await usersApi.assignRole(student.id, role);
      setStudent(await usersApi.getByStudentId(student.studentId ?? studentId.trim()));
      onRoleGranted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <Card title="Find a student">
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

      {student && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <UserTableHead />
            </thead>
            <tbody>
              <UserRow user={student} assigning={assigning} onAssignRole={handleAssignRole} />
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function UserTableHead() {
  return (
    <tr className="text-left text-slate-500 border-b border-slate-100">
      <th className="py-2 pr-4 font-medium">Name</th>
      <th className="py-2 pr-4 font-medium">Email</th>
      <th className="py-2 pr-4 font-medium">Student ID</th>
      <th className="py-2 pr-4 font-medium">Roles</th>
      <th className="py-2 pr-4 font-medium">Status</th>
      <th className="py-2 pr-4 font-medium">Grant role</th>
    </tr>
  );
}

function UserRow({
  user,
  assigning,
  onAssignRole,
}: {
  user: StaffUser;
  assigning: boolean;
  onAssignRole: (role: string) => void;
}) {
  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="py-3 pr-4 font-medium text-ink">
        {user.firstName} {user.lastName}
      </td>
      <td className="py-3 pr-4 text-slate-600">{user.email}</td>
      <td className="py-3 pr-4 text-slate-600">{user.studentId || "—"}</td>
      <td className="py-3 pr-4 space-x-1">
        {user.roles.map((role) => (
          <Badge key={role.id} tone="slate">
            {role.name}
          </Badge>
        ))}
      </td>
      <td className="py-3 pr-4">
        <Badge tone={user.active ? "green" : "red"}>{user.active ? "Active" : "Inactive"}</Badge>
      </td>
      <td className="py-3 pr-4">
        <select
          value=""
          disabled={assigning}
          onChange={(e) => {
            if (e.target.value) onAssignRole(e.target.value);
            e.target.value = "";
          }}
          className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-60"
        >
          <option value="">{assigning ? "Saving…" : "Grant role…"}</option>
          {ASSIGNABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}
