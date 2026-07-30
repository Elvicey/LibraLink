import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Search, X, type LucideIcon } from "lucide-react";
import { BookMarked } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

export interface HelpTopic {
  question: string;
  answer: string;
}

export function AppShell({
  portalLabel,
  nav,
  activeKey,
  onNavigate,
  pageTitle,
  pageSubtitle,
  headerAction,
  search,
  helpTopics,
  children,
}: {
  portalLabel: string;
  nav: NavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  pageTitle: string;
  pageSubtitle?: string;
  headerAction?: ReactNode;
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
  helpTopics?: HelpTopic[];
  children: ReactNode;
}) {
  const { firstName, lastName, roles, schoolShortName, clearSession } = useAuth();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";

  function handleSignOut() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="hidden md:flex md:w-60 md:flex-col shrink-0 bg-sidebar">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shrink-0">
            <BookMarked className="h-5 w-5" />
          </span>
          <div className="leading-tight min-w-0">
            <div className="text-white font-bold text-sm">LibraLink</div>
            <div className="text-[11px] text-slate-400 truncate">{portalLabel}</div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 mt-2">
          {nav.map((item) => {
            const active = item.key === activeKey;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-primary text-white" : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        {helpTopics && helpTopics.length > 0 && (
          <div className="px-3 pb-4 pt-2 border-t border-white/10">
            <button
              onClick={() => setHelpOpen(true)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-sidebar-hover hover:text-white transition"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              Help Center
            </button>
          </div>
        )}
      </aside>

      {helpOpen && helpTopics && <HelpCenterModal topics={helpTopics} onClose={() => setHelpOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200">
          <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
            {search ? (
              <div className="relative flex-1 max-w-sm">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  placeholder={search.placeholder ?? "Search…"}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            ) : (
              <div className="flex-1" />
            )}
            <div className="flex items-center gap-3">
              <div className="text-right text-sm hidden sm:block">
                <div className="font-semibold text-ink leading-tight">
                  {firstName} {lastName}
                </div>
                <div className="text-xs text-slate-500">
                  {roles.join(", ")}
                  {schoolShortName ? ` · ${schoolShortName}` : ""}
                </div>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                {initials}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 whitespace-nowrap"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="md:hidden flex gap-2 overflow-x-auto px-3 pb-2">
            {nav.map((item) => {
              const active = item.key === activeKey;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                    active ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
            {helpTopics && helpTopics.length > 0 && (
              <button
                onClick={() => setHelpOpen(true)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap bg-slate-100 text-slate-600"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Help Center
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-ink">{pageTitle}</h1>
              {pageSubtitle && <p className="text-sm text-slate-500 mt-0.5">{pageSubtitle}</p>}
            </div>
            {headerAction}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function HelpCenterModal({ topics, onClose }: { topics: HelpTopic[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Help Center"
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-ink flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            Help Center
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {topics.map((topic, i) => (
            <div key={i}>
              <div className="text-sm font-semibold text-ink mb-1">{topic.question}</div>
              <div className="text-sm text-slate-600">{topic.answer}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Card({ title, action, children }: { title?: ReactNode; action?: ReactNode; children: ReactNode }) {
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

const STAT_TONE_CLASSES: Record<"primary" | "success" | "warning" | "danger", string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger";
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${STAT_TONE_CLASSES[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-2xl font-bold text-ink tabular-nums">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
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

export function usePagination<T>(items: T[], pageSize = 8) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { page, setPage, totalPages, pageItems, pageSize, total: items.length };
}

export function PaginationFooter({
  page,
  totalPages,
  onChange,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  total: number;
  pageSize: number;
}) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-sm">
      <span className="text-slate-500">
        Showing {start}-{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-slate-300 px-2.5 py-1 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
        >
          Prev
        </button>
        <span className="text-slate-500 tabular-nums">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-slate-300 px-2.5 py-1 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
