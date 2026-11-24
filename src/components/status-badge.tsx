import { cn } from "@/lib/utils"

export function StatusBadge({ status, quiet = false }: { status: "pending" | "success" | "failed" | "canceled" | "expired" | "unknown" | "detected" | "confirming" | "credit_pending" | "credited"; quiet?: boolean }) {
  const content = {
    pending: { label: "Pending", dot: "bg-warning", pill: "bg-warning-surface text-warning" },
    success: { label: "Completed", dot: "bg-success", pill: "bg-success-surface text-success" },
    failed: { label: "Failed", dot: "bg-danger", pill: "bg-danger-surface text-danger" },
    canceled: { label: "Canceled", dot: "bg-muted-foreground", pill: "bg-surface-3 text-muted-foreground" },
    detected: { label: "Detected", dot: "bg-warning", pill: "bg-warning-surface text-warning" },
    confirming: { label: "Confirming", dot: "bg-warning", pill: "bg-warning-surface text-warning" },
    credit_pending: { label: "Credit pending", dot: "bg-warning", pill: "bg-warning-surface text-warning" },
    credited: { label: "Completed", dot: "bg-success", pill: "bg-success-surface text-success" },
    expired: { label: "Expired", dot: "bg-muted-foreground", pill: "bg-surface-3 text-muted-foreground" },
    unknown: { label: "Checking", dot: "bg-warning", pill: "bg-warning-surface text-warning" },
  }[status]

  if (quiet) {
    return (
      <span className="inline-flex min-w-0 items-center gap-2 text-[12px] leading-4 text-muted-foreground">
        <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", content.dot)} />
        <span className="truncate">{content.label}</span>
      </span>
    )
  }

  return (
    <span className={cn("inline-flex h-auto items-center gap-2 rounded-full px-2 py-1 text-[12px] font-medium", content.pill)}>
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-current" />
      {content.label}
    </span>
  )
}
