"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleProviderAction, updateProviderIntervalAction } from "@/app/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export interface ProviderRow {
  id: string;
  key: string;
  name: string;
  isEnabled: boolean;
  scrapeIntervalMinutes: number;
  status: string;
  lastSuccessAt: Date | null;
  lastErrorAt: Date | null;
  lastError: string | null;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  HEALTHY: "success",
  DEGRADED: "warning",
  DOWN: "danger",
  DISABLED: "default",
};

export function ProvidersPanel({ providers }: { providers: ProviderRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
      {providers.map((p) => (
        <div key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Switch
              checked={p.isEnabled}
              disabled={pending}
              onCheckedChange={(checked) =>
                startTransition(async () => {
                  await toggleProviderAction(p.id, checked);
                  toast.success(`${p.name} ${checked ? "enabled" : "disabled"}`);
                })
              }
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-fg">{p.name}</p>
                <Badge variant={STATUS_VARIANT[p.status] ?? "default"}>{p.status.toLowerCase()}</Badge>
              </div>
              <p className="text-xs text-fg-subtle">
                {p.lastSuccessAt ? `Last successful scrape ${p.lastSuccessAt.toLocaleString("en-GB")}` : "Never scraped yet"}
                {p.lastError && p.status !== "HEALTHY" ? ` · ${p.lastError}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <label htmlFor={`interval-${p.id}`}>Scrape every</label>
            <Input
              id={`interval-${p.id}`}
              type="number"
              min={5}
              defaultValue={p.scrapeIntervalMinutes}
              className="h-8 w-20 text-xs"
              onBlur={(e) => {
                const minutes = Number(e.target.value);
                if (minutes > 0 && minutes !== p.scrapeIntervalMinutes) {
                  startTransition(async () => {
                    await updateProviderIntervalAction(p.id, minutes);
                    toast.success("Scrape interval updated");
                  });
                }
              }}
            />
            <span>min</span>
          </div>
        </div>
      ))}
    </div>
  );
}
