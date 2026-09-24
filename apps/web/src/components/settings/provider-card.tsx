"use client";

import { History, Loader2, Play, ScrollText } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleProviderAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ProviderErrorDetail } from "./provider-error-detail";
import { ProviderHealthBadge, type ProviderHealthState } from "./provider-health-badge";
import { ProviderHistoryDialog } from "./provider-history-dialog";
import { ProviderSettingsDialog } from "./provider-settings-dialog";
import { formatDuration, formatFineRelativeTime } from "./relative-time";

export interface ProviderDiagnostic {
  id: string;
  key: string;
  name: string;
  baseUrl: string | null;
  isEnabled: boolean;
  healthState: ProviderHealthState;
  scrapeIntervalMinutes: number;
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  nextRunAt: string | null;
  inFlight: { jobId: string; state: string; attemptsMade: number; attemptsMax: number; retryAt: string | null } | null;
  latestRun: {
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
    errorType: string | null;
    errorTypeLabel: string | null;
    errorMessage: string | null;
    errorDetail: string | null;
    httpStatus: number | null;
    jobId: string | null;
  } | null;
  config: unknown;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-fg-subtle">{label}</span>
      <span className="font-medium text-fg">{value}</span>
    </div>
  );
}

export function ProviderCard({ provider, onRefreshNow }: { provider: ProviderDiagnostic; onRefreshNow: () => void }) {
  const [pending, startTransition] = useTransition();
  const [triggering, setTriggering] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const run = provider.latestRun;
  const rateLimit = (provider.config as { rateLimit?: Record<string, number> } | null)?.rateLimit;
  const isRetrying = provider.inFlight?.state === "delayed" && (provider.inFlight.attemptsMade ?? 0) > 0;
  const isQueuedOrRunning = provider.inFlight?.state === "waiting" || provider.inFlight?.state === "active" || triggering;

  const handleRunNow = () => {
    setTriggering(true);
    fetch(`/api/providers/${provider.key}/run`, { method: "POST" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.ok) {
          toast.error(body.message ?? "Could not start the scrape.");
          setTriggering(false);
          return;
        }
        toast.success(`${provider.name}: scrape queued`);
        const jobId = body.jobId as string;
        let ticks = 0;
        pollRef.current = setInterval(async () => {
          ticks += 1;
          const statusRes = await fetch(`/api/providers/${provider.key}/job-status?jobId=${jobId}`);
          const statusBody = await statusRes.json();
          const state = statusBody.job?.state;
          if (state === "completed" || state === "failed" || state === "not_found" || ticks > 40) {
            if (pollRef.current) clearInterval(pollRef.current);
            setTriggering(false);
            onRefreshNow();
          }
        }, 2000);
      })
      .catch(() => {
        toast.error("Could not reach the server.");
        setTriggering(false);
      });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Switch
            checked={provider.isEnabled}
            disabled={pending}
            onCheckedChange={(checked) =>
              startTransition(async () => {
                await toggleProviderAction(provider.id, checked);
                toast.success(`${provider.name} ${checked ? "enabled" : "disabled"}`);
                onRefreshNow();
              })
            }
          />
          <h3 className="text-sm font-semibold text-fg">{provider.name}</h3>
        </div>
        <ProviderHealthBadge state={provider.healthState} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        <Stat label="Last successful scrape" value={formatFineRelativeTime(provider.lastSuccessAt)} />
        <Stat label="Last attempt" value={formatFineRelativeTime(provider.lastAttemptAt)} />
        <Stat label="Duration" value={formatDuration(run?.durationMs ?? null)} />
        <Stat label="Listings discovered" value={run ? String(run.listingsDiscovered) : "—"} />
        <Stat label="New" value={run ? String(run.listingsNew) : "—"} />
        <Stat label="Updated" value={run ? String(run.listingsUpdated) : "—"} />
        <Stat label="Unchanged" value={run ? String(run.listingsUnchanged) : "—"} />
        <Stat label="Unavailable" value={run ? String(run.listingsRemoved) : "—"} />
        {provider.isEnabled && (
          <Stat
            label="Next run"
            value={isRetrying ? "Retrying soon" : isQueuedOrRunning ? "In progress" : formatFineRelativeTime(provider.nextRunAt)}
          />
        )}
        {provider.consecutiveFailures > 0 && (
          <Stat label="Consecutive failures" value={String(provider.consecutiveFailures)} />
        )}
      </div>

      {isRetrying && provider.inFlight?.retryAt && (
        <p className="text-xs text-warning">
          Retrying {formatFineRelativeTime(provider.inFlight.retryAt)} — attempt {provider.inFlight.attemptsMade + 1} of{" "}
          {provider.inFlight.attemptsMax}
        </p>
      )}

      {run && (run.status === "FAILED" || run.status === "PARTIAL") && run.errorMessage && (
        <ProviderErrorDetail
          userMessage={run.errorMessage}
          errorTypeLabel={run.errorTypeLabel}
          httpStatus={run.httpStatus}
          jobId={run.jobId}
          technicalDetail={run.errorDetail}
          timestamp={run.finishedAt ?? run.startedAt}
        />
      )}
      {run && run.status === "FAILED" && (
        <p className="text-xs text-fg-subtle">The worker will retry automatically using exponential backoff.</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        <Button variant="secondary" size="sm" disabled={!provider.isEnabled || isQueuedOrRunning} onClick={handleRunNow}>
          {isQueuedOrRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {isQueuedOrRunning ? "Running…" : run?.status === "FAILED" ? "Retry now" : "Run now"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
          <History className="h-3.5 w-3.5" />
          View history
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
          <ScrollText className="h-3.5 w-3.5" />
          View logs
        </Button>
        <ProviderSettingsDialog
          providerId={provider.id}
          providerName={provider.name}
          scrapeIntervalMinutes={provider.scrapeIntervalMinutes}
          rateLimit={rateLimit}
        />
      </div>

      <ProviderHistoryDialog
        providerKey={provider.key}
        providerName={provider.name}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        initialExpandLatest
      />
    </div>
  );
}
