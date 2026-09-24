"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changePasswordAction, updateAccountAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function AccountPanel({ email, name }: { email: string; name: string | null }) {
  const [displayName, setDisplayName] = useState(name ?? "");
  const [namePending, startNameTransition] = useTransition();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordPending, startPasswordTransition] = useTransition();

  return (
    <div className="flex max-w-md flex-col gap-6 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-col gap-1.5">
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display-name">Display name</Label>
        <div className="flex gap-2">
          <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Button
            variant="secondary"
            disabled={namePending}
            onClick={() =>
              startNameTransition(async () => {
                await updateAccountAction({ name: displayName });
                toast.success("Name updated");
              })
            }
          >
            Save
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-fg">Change password</p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current-password">Current password</Label>
          <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <Button
          variant="secondary"
          className="self-start"
          disabled={passwordPending || !currentPassword || !newPassword}
          onClick={() =>
            startPasswordTransition(async () => {
              const result = await changePasswordAction({ currentPassword, newPassword });
              if (result.ok) {
                toast.success("Password changed");
                setCurrentPassword("");
                setNewPassword("");
              } else {
                toast.error(result.error ?? "Failed to change password");
              }
            })
          }
        >
          Update password
        </Button>
      </div>
    </div>
  );
}
