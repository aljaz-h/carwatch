import { CarFront } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-fg-subtle">
        <CarFront className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-fg">Page not found</h1>
        <p className="mt-1 text-sm text-fg-muted">This listing or page may have been removed.</p>
      </div>
      <Button asChild size="sm">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
