"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSavedSearchAction } from "@/app/(app)/saved-searches/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface AlertRules {
  notifyNewMatch: boolean;
  minMatchScore: number;
  notifyPriceDrop: boolean;
  minPriceDropAmount: number | null;
  maxPrice: number | null;
}

export function AlertRulesForm({ savedSearchId, initial }: { savedSearchId: string; initial: AlertRules }) {
  const [rules, setRules] = useState(initial);
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      await updateSavedSearchAction(savedSearchId, rules);
      toast.success("Alert settings saved");
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-fg">Alerts</h2>

      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-fg">Notify on new matches</Label>
          <p className="text-xs text-fg-subtle">Alert when a new listing meets your required criteria.</p>
        </div>
        <Switch checked={rules.notifyNewMatch} onCheckedChange={(v) => setRules((r) => ({ ...r, notifyNewMatch: v }))} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="min-score">Minimum match score</Label>
        <div className="flex items-center gap-2">
          <Input
            id="min-score"
            type="number"
            min={0}
            max={100}
            value={rules.minMatchScore}
            onChange={(e) => setRules((r) => ({ ...r, minMatchScore: Number(e.target.value) }))}
            className="w-24"
          />
          <span className="text-xs text-fg-subtle">%</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="max-price">Only notify below price</Label>
        <Input
          id="max-price"
          type="number"
          placeholder="No limit"
          value={rules.maxPrice ?? ""}
          onChange={(e) => setRules((r) => ({ ...r, maxPrice: e.target.value ? Number(e.target.value) : null }))}
          className="w-32"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-fg">Notify on price drops</Label>
          <p className="text-xs text-fg-subtle">Alert when a matched listing gets cheaper.</p>
        </div>
        <Switch checked={rules.notifyPriceDrop} onCheckedChange={(v) => setRules((r) => ({ ...r, notifyPriceDrop: v }))} />
      </div>

      {rules.notifyPriceDrop && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="min-drop">Minimum price drop</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-subtle">€</span>
            <Input
              id="min-drop"
              type="number"
              placeholder="Any amount"
              value={rules.minPriceDropAmount ?? ""}
              onChange={(e) => setRules((r) => ({ ...r, minPriceDropAmount: e.target.value ? Number(e.target.value) : null }))}
              className="w-28"
            />
          </div>
        </div>
      )}

      <Button onClick={save} disabled={pending} size="sm" className="self-start">
        {pending ? "Saving…" : "Save alert settings"}
      </Button>
    </div>
  );
}
