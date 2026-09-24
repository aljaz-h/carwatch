"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateGeneralSettingsAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GeneralPanel({ initial }: { initial: { siteName: string; defaultCurrency: string; timezone: string } }) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex max-w-md flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="site-name">Site name</Label>
        <Input id="site-name" value={values.siteName} onChange={(e) => setValues((v) => ({ ...v, siteName: e.target.value }))} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currency">Default currency</Label>
        <Input id="currency" value={values.defaultCurrency} onChange={(e) => setValues((v) => ({ ...v, defaultCurrency: e.target.value }))} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timezone">Timezone</Label>
        <Input id="timezone" value={values.timezone} onChange={(e) => setValues((v) => ({ ...v, timezone: e.target.value }))} />
      </div>
      <Button
        variant="secondary"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateGeneralSettingsAction(values);
            toast.success("Settings saved");
          })
        }
      >
        Save settings
      </Button>
    </div>
  );
}
