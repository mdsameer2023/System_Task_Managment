import { forwardRef } from "react";
import { X, AlertTriangle, LoaderCircle } from "lucide-react";

export const cn = (...values) => values.filter(Boolean).join(" ");
export function Button({
  className,
  variant = "primary",
  loading,
  children,
  ...props
}) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary:
      "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost:
      "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  };
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}>
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
export const Field = forwardRef(function Field(
  { label, error, className, ...props },
  ref,
) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <input
        ref={ref}
        className={cn(
          "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-brand-950",
          className,
        )}
        {...props}
      />
      {error && (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      )}
    </label>
  );
});
export const Select = forwardRef(function Select(
  { label, error, children, className, ...props },
  ref,
) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <select
        ref={ref}
        className={cn(
          "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white",
          className,
        )}
        {...props}>
        {children}
      </select>
      {error && (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      )}
    </label>
  );
});
export const Textarea = forwardRef(function Textarea(
  { label, error, ...props },
  ref,
) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <textarea
        ref={ref}
        className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        {...props}
      />
      {error && (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      )}
    </label>
  );
});
const badgeColor = {
  PLANNING: "bg-slate-100 text-slate-700",
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  REVIEW: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-zinc-200 text-zinc-700",
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-rose-100 text-rose-700",
};
export function Badge({ value }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
        badgeColor[value] || badgeColor.LOW,
      )}>
      {String(value).replaceAll("_", " ")}
    </span>
  );
}
export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true">
      <div
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900",
          wide ? "max-w-3xl" : "max-w-lg",
        )}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Loading({ label = "Loading…" }) {
  return (
    <div className="flex min-h-52 items-center justify-center gap-3 text-slate-500">
      <LoaderCircle className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}
export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
      <AlertTriangle className="mx-auto mb-3 h-7 w-7" />
      <p>{message || "Unable to load this page. Please try again."}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
export function Pagination({ value, onChange }) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 dark:border-slate-800 sm:flex-row">
      <span>{value.totalRecords} total records</span>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          disabled={value.currentPage <= 1}
          onClick={() => onChange(value.currentPage - 1)}>
          Previous
        </Button>
        <span>
          Page{" "}
          <strong className="text-slate-900 dark:text-white">
            {value.currentPage}
          </strong>{" "}
          of {value.totalPages}
        </span>
        <Button
          variant="secondary"
          disabled={value.currentPage >= value.totalPages}
          onClick={() => onChange(value.currentPage + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
