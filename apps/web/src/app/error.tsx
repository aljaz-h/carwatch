"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-base font-sans text-fg antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-muted text-danger">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-fg">Something went wrong</h1>
            <p className="mt-1 text-sm text-fg-muted">An unexpected error occurred. You can try again.</p>
          </div>
          <Button size="sm" onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
