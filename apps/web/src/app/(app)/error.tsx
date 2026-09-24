"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-muted text-danger">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-fg">Something went wrong</h1>
        <p className="mt-1 text-sm text-fg-muted">Failed to load this page. You can try again.</p>
      </div>
      <Button size="sm" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
