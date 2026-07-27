import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function DashboardShell({
  title,
  subtitle,
  tabs,
  children,
}: {
  title: string;
  subtitle?: string;
  tabs?: ReactNode;
  children: ReactNode;
}) {
  const { firstName, lastName, roles, schoolId, schoolShortName, clearSession } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h1 className="text-lg font-bold text-ink">{title}</h1>
            </div>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <div className="font-medium text-ink">
                {firstName} {lastName}
              </div>
              <div className="text-slate-500">
                {roles.join(", ")}
                {schoolId ? ` · ${schoolShortName || `School #${schoolId}`}` : " · Platform-wide"}
              </div>
            </div>
            <button
              onClick={() => {
                clearSession();
                navigate("/login", { replace: true });
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
        {tabs && <div className="max-w-6xl mx-auto px-6 flex gap-1 -mb-px">{tabs}</div>}
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

export function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          {title && <h2 className="font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

export function Badge({ tone, children }: { tone: "green" | "red" | "slate" | "amber"; children: ReactNode }) {
  const tones: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Banner({ tone, message }: { tone: "error" | "success"; message: string | null }) {
  if (!message) return null;
  const cls =
    tone === "error"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-emerald-50 border-emerald-200 text-emerald-700";
  return <div className={`mb-4 rounded-lg border text-sm px-3 py-2 ${cls}`}>{message}</div>;
}

export function CodeReveal({ label, code, hint }: { label: string; code: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="text-xs font-medium text-amber-700 mb-1">{label} — shown once, save it now</div>
      <div className="font-mono text-lg font-bold tracking-wider text-amber-900">{code}</div>
      {hint && <div className="text-xs text-amber-600 mt-1">{hint}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="text-sm text-slate-400 text-center py-8">{children}</div>;
}
