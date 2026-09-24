import Link from "next/link";
import type { ReactNode } from "react";

export function DashboardSection({ title, viewAllHref, children }: { title: string; viewAllHref?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs font-medium text-accent hover:underline">
            View all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
