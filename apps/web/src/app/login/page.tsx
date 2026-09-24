import { Car } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-4">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-fg">
            <Car className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-fg">CarWatch</h1>
            <p className="text-sm text-fg-muted">Sign in to your listing monitor</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-xl shadow-black/30">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-fg-subtle">Self-hosted &middot; accounts are created by an administrator</p>
      </div>
    </div>
  );
}
