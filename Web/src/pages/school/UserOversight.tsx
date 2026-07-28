import { useEffect, useState } from "react";
import { usersApi, type StaffUser } from "../../api/users";
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
      .list()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users."))
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
    <Card title="Users">
      <Banner tone="error" message={error} />
      {loading ? (
        <EmptyState>Loading users…</EmptyState>
      ) : users.length === 0 ? (
        <EmptyState>No users at your school yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Student ID</th>
                <th className="py-2 pr-4 font-medium">Roles</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Grant role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 last:border-0">
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
                      disabled={assigningId === user.id}
                      onChange={(e) => {
                        if (e.target.value) handleAssignRole(user.id, e.target.value);
                        e.target.value = "";
                      }}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-60"
                    >
                      <option value="">
                        {assigningId === user.id ? "Saving…" : "Grant role…"}
                      </option>
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
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
