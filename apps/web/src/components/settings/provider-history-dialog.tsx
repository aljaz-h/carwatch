"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDuration } from "./relative-time";

interface RunLogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
}

interface RunRow {
  id: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  listingsDiscovered: number;
  listingsNew: number;
  listingsUpdated: number;
  listingsUnchanged: number;
  listingsRemoved: number;
  errorsCount: number;
  isSuspicious: boolean;
  errorTypeLabel: string | null;
  errorMessage: string | null;
  httpStatus: number | null;
  logs?: RunLogEntry[];
}

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "danger" | "default"; label: string }> = {
  SUCCESS: { variant: "success", label: "Success" },
  PARTIAL: { variant: "warning", label: "Partial" },
  FAILED: { variant: "danger", label: "Failed" },
  RUNNING: { variant: "default", label: "Running" },
  CANCELLED: { variant: "default", label: "Cancelled" },
};

const FILTERS = [
  ["all", "All"],
  ["success", "Success"],
  ["partial", "Warning"],
  ["failed", "Failed"],
] as const;

export function ProviderHistoryDialog({
  providerKey,
  providerName,
  open,
  onOpenChange,
  initialExpandLatest,
}: {
  providerKey: string;
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialExpandLatest?: boolean;
}) {
  const [status, setStatus] = useState<(typeof FILTERS)[number][0]>("all");
  const [runs, setRuns] = useState<RunRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/providers/${providerKey}/history?status=${status}`)
      .then((res) => res.json())
      .then((body) => setRuns(body.runs ?? []))
      .finally(() => setLoading(false));
  }, [open, providerKey, status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{providerName} — run history</DialogTitle>
        </DialogHeader>

        <Tabs value={status} onValueChange={(v) => setStatus(v as (typeof FILTERS)[number][0])}>
          <TabsList>
            {FILTERS.map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
          {loading && <p className="py-6 text-center text-sm text-fg-subtle">Loading…</p>}
          {!loading && runs?.length === 0 && <p className="py-6 text-center text-sm text-fg-subtle">No runs in this category yet.</p>}
          {!loading &&
            runs?.map((run, i) => <RunRowItem key={run.id} run={run} defaultOpen={initialExpandLatest && i === 0} />)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RunRowItem({ run, defaultOpen }: { run: RunRow; defaultOpen?: boolean }) {
  const badge = STATUS_BADGE[run.status] ?? STATUS_BADGE.RUNNING!;
  const hasDetail = (run.logs && run.logs.length > 0) || run.errorMessage;

  const summaryContent = (
    <div className="flex flex-1 items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {run.isSuspicious && <Badge variant="warning">Suspicious</Badge>}
        {run.trigger === "MANUAL" && <Badge variant="outline">Manual</Badge>}
        <span className="text-xs text-fg-subtle">{new Date(run.startedAt).toLocaleString("en-GB")}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-fg-muted">
        <span>{run.listingsDiscovered} listings</span>
        {run.listingsNew > 0 && <span className="text-success">{run.listingsNew} new</span>}
        <span>{formatDuration(run.durationMs)}</span>
      </div>
    </div>
  );

  if (!hasDetail) {
    return <div className="rounded-md border border-border bg-surface-2 px-3 py-2.5">{summaryContent}</div>;
  }

  return (
    <details className="group rounded-md border border-border bg-surface-2 px-3 py-2.5" open={defaultOpen}>
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">{summaryContent}</summary>
      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
        {run.errorMessage && (
          <div className="rounded-md border border-danger/25 bg-danger-muted/40 p-2.5 text-xs text-fg">
            {run.errorMessage}
            {run.errorTypeLabel && <span className="ml-1 text-fg-subtle">({run.errorTypeLabel})</span>}
          </div>
        )}
        {run.logs && run.logs.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-md bg-surface-3/50 p-2.5 font-mono text-[11px] text-fg-muted">
            {run.logs.map((log, i) => (
              <li key={i} className={log.level === "error" ? "text-danger" : log.level === "warn" ? "text-warning" : undefined}>
                <span className="text-fg-subtle">{new Date(log.ts).toLocaleTimeString("en-GB")}</span> {log.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
