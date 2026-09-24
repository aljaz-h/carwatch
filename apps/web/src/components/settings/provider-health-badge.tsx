import { CheckCircle2, CircleSlash, HelpCircle, TriangleAlert, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProviderHealthState = "HEALTHY" | "WARNING" | "ERROR" | "DISABLED" | "NEVER_RUN";

const META: Record<ProviderHealthState, { label: string; icon: LucideIcon; className: string }> = {
  HEALTHY: { label: "Healthy", icon: CheckCircle2, className: "border-success/30 bg-success-muted text-success" },
  WARNING: { label: "Warning", icon: TriangleAlert, className: "border-warning/30 bg-warning-muted text-warning" },
  ERROR: { label: "Error", icon: XCircle, className: "border-danger/30 bg-danger-muted text-danger" },
  DISABLED: { label: "Disabled", icon: CircleSlash, className: "border-border-strong bg-surface-3 text-fg-subtle" },
  NEVER_RUN: { label: "Never run", icon: HelpCircle, className: "border-border-strong bg-surface-3 text-fg-muted" },
};

export function ProviderHealthBadge({ state, className }: { state: ProviderHealthState; className?: string }) {
  const meta = META[state] ?? META.NEVER_RUN;
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", meta.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
