import { cn } from "@/lib/utils";

// A badge is a SIGNAL (DESIGN.md signature #4): a full-radius pill, text-xs at
// normal weight, a tinted fill with a thin same-hue border and colored text.
type Tone = "success" | "warning" | "danger" | "neutral";

const TONE: Record<Tone, string> = {
  success: "bg-success-tint text-success border-success/30",
  warning: "bg-warning-tint text-warning border-warning/30",
  danger: "bg-danger-tint text-danger border-danger/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
  // Client
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  // Session
  scheduled: { label: "Scheduled", tone: "neutral" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  no_show: { label: "No Show", tone: "danger" },
  // Payment
  paid: { label: "Paid", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS[status] || { label: status, tone: "neutral" as const };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-normal capitalize",
        TONE[config.tone],
      )}
    >
      {config.label}
    </span>
  );
}
