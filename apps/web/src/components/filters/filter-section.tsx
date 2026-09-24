"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function FilterSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-border py-3.5 first:pt-0 last:border-b-0" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-wide text-fg-muted [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-3.5 w-3.5 text-fg-subtle transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </details>
  );
}
