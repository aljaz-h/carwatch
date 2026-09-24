"use client";

import { Settings2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProviderIntervalAction, updateProviderRateLimitAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RateLimitConfig {
  minDelayMs: number;
  jitterMs: number;
  concurrency: number;
  maxRetries: number;
  timeoutMs: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = { minDelayMs: 1500, jitterMs: 1500, concurrency: 2, maxRetries: 3, timeoutMs: 15000 };

export function ProviderSettingsDialog({
  providerId,
  providerName,
  scrapeIntervalMinutes,
  rateLimit,
}: {
  providerId: string;
  providerName: string;
  scrapeIntervalMinutes: number;
  rateLimit: Partial<RateLimitConfig> | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [interval_, setInterval_] = useState(scrapeIntervalMinutes);
  const [rl, setRl] = useState<RateLimitConfig>({ ...DEFAULT_RATE_LIMIT, ...rateLimit });
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const [intervalResult, rateLimitResult] = await Promise.all([
        updateProviderIntervalAction(providerId, interval_),
        updateProviderRateLimitAction(providerId, rl),
      ]);
      const error = intervalResult.error ?? rateLimitResult.error;
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`${providerName} settings saved`);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings2 className="h-3.5 w-3.5" />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{providerName} settings</DialogTitle>
          <DialogDescription>Sensible defaults are already set — only change these if you know why.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="interval">Scrape interval (minutes)</Label>
            <Input id="interval" type="number" min={5} value={interval_} onChange={(e) => setInterval_(Number(e.target.value))} />
            <p className="text-[11px] text-fg-subtle">Minimum 5 minutes — scraping faster risks getting blocked.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="minDelay">Delay between requests (ms)</Label>
              <Input id="minDelay" type="number" min={200} value={rl.minDelayMs} onChange={(e) => setRl((r) => ({ ...r, minDelayMs: Number(e.target.value) }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jitter">Jitter (ms)</Label>
              <Input id="jitter" type="number" min={0} value={rl.jitterMs} onChange={(e) => setRl((r) => ({ ...r, jitterMs: Number(e.target.value) }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="concurrency">Concurrency</Label>
              <Input id="concurrency" type="number" min={1} max={10} value={rl.concurrency} onChange={(e) => setRl((r) => ({ ...r, concurrency: Number(e.target.value) }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="retries">Retry count</Label>
              <Input id="retries" type="number" min={0} max={10} value={rl.maxRetries} onChange={(e) => setRl((r) => ({ ...r, maxRetries: Number(e.target.value) }))} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="timeout">Request timeout (ms)</Label>
              <Input id="timeout" type="number" min={2000} value={rl.timeoutMs} onChange={(e) => setRl((r) => ({ ...r, timeoutMs: Number(e.target.value) }))} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
