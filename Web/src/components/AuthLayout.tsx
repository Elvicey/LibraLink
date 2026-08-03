import { useState, type ReactNode } from "react";
import { BookMarked, Eye, EyeOff, type LucideIcon } from "lucide-react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white mb-3">
            <BookMarked className="h-6 w-6" />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Admin Console</div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">{children}</div>
        {footer && <div className="text-center mt-4 text-sm text-slate-500">{footer}</div>}
        <p className="text-center mt-8 text-xs text-slate-400">© {new Date().getFullYear()} LibraLink</p>
      </div>
    </div>
  );
}

export function FormField({
  label,
  icon: Icon,
  type,
  ...props
}: { label: string; icon?: LucideIcon } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword ? (reveal ? "text" : "password") : type;

  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      <div className="relative">
        {Icon && <Icon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />}
        <input
          {...props}
          type={effectiveType}
          className={`w-full rounded-lg border border-slate-300 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:bg-slate-100 ${
            Icon ? "pl-9" : "pl-3"
          } ${isPassword ? "pr-9" : "pr-3"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            tabIndex={-1}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      <select
        {...props}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:bg-slate-100"
      >
        {children}
      </select>
    </label>
  );
}

export function TextAreaField({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      <textarea
        {...props}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:bg-slate-100"
      />
    </label>
  );
}

export function CheckboxField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2 mb-4 text-sm text-slate-700">
      <input type="checkbox" {...props} className="rounded border-slate-300 text-primary focus:ring-primary/40" />
      {label}
    </label>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
      {message}
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-primary text-white font-semibold px-6 py-2.5 text-sm hover:opacity-90 disabled:opacity-60 transition"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
