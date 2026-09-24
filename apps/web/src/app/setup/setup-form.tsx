"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setupAction, type SetupState } from "./actions";

const initialState: SetupState = {};

export function SetupForm() {
  const [state, formAction, pending] = useActionState(setupAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" type="text" autoComplete="name" placeholder="Optional" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} placeholder="••••••••" />
      </div>

      {state.error && (
        <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-xs text-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Creating account…" : "Create administrator"}
      </Button>
    </form>
  );
}
