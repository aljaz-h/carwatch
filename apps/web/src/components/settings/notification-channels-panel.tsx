"use client";

import { Plus, Send, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createNotificationChannelAction,
  deleteNotificationChannelAction,
  testNotificationChannelAction,
  updateNotificationChannelAction,
} from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface ChannelRow {
  id: string;
  type: string;
  label: string;
  isEnabled: boolean;
  config: unknown;
}

export function NotificationChannelsPanel({ channels }: { channels: ChannelRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
        {channels.length === 0 && <p className="p-4 text-sm text-fg-subtle">No notification channels configured yet.</p>}
        {channels.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={c.isEnabled}
                onCheckedChange={(checked) =>
                  startTransition(async () => {
                    await updateNotificationChannelAction(c.id, { isEnabled: checked });
                  })
                }
              />
              <div>
                <p className="text-sm font-medium text-fg">{c.label}</p>
                <p className="text-xs text-fg-subtle">{c.type === "DISCORD" ? "Discord webhook" : "Email"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await testNotificationChannelAction(c.id);
                    if (result.ok) toast.success("Test notification sent");
                    else toast.error(result.error ?? "Failed to send test notification");
                  })
                }
                aria-label="Send test notification"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  startTransition(async () => {
                    await deleteNotificationChannelAction(c.id);
                    toast.success("Channel removed");
                  })
                }
                aria-label="Delete channel"
              >
                <Trash2 className="h-3.5 w-3.5 text-danger" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <AddChannelDialog />
    </div>
  );
}

function AddChannelDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"DISCORD" | "EMAIL">("DISCORD");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const config: Record<string, string> = type === "DISCORD" ? { webhookUrl: value } : { to: value };
      await createNotificationChannelAction({ type, label: label || (type === "DISCORD" ? "Discord" : "Email"), config });
      toast.success("Notification channel added");
      setOpen(false);
      setLabel("");
      setValue("");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="self-start">
          <Plus className="h-3.5 w-3.5" />
          Add channel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add notification channel</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "DISCORD" | "EMAIL")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DISCORD">Discord webhook</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-label">Label</Label>
            <Input id="channel-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Car alerts" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-value">{type === "DISCORD" ? "Webhook URL" : "Email address"}</Label>
            <Input
              id="channel-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "DISCORD" ? "https://discord.com/api/webhooks/…" : "you@example.com"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !value}>
            {pending ? "Adding…" : "Add channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
