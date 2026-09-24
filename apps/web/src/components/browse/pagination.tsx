"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (pageCount <= 1) return null;

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goTo(page - 1)}>
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </Button>
      <span className="text-xs text-fg-muted">
        Page {page} of {pageCount}
      </span>
      <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => goTo(page + 1)}>
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
