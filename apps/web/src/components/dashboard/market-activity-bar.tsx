import { Activity, CheckCircle2, PlusCircle } from "lucide-react";

export function MarketActivityBar({ totalActive, addedLast24h, healthyProviders, totalProviders }: { totalActive: number; addedLast24h: number; healthyProviders: number; totalProviders: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-fg-muted">
      <span className="inline-flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5 text-fg-subtle" />
        <span className="font-medium text-fg">{totalActive.toLocaleString("en-US")}</span> listings tracked
      </span>
      <span className="inline-flex items-center gap-1.5">
        <PlusCircle className="h-3.5 w-3.5 text-fg-subtle" />
        <span className="font-medium text-fg">{addedLast24h}</span> added in the last 24h
      </span>
      <span className="inline-flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-fg-subtle" />
        <span className="font-medium text-fg">
          {healthyProviders}/{totalProviders}
        </span>{" "}
        marketplaces healthy
      </span>
    </div>
  );
}
