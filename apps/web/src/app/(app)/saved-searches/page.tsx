import type { FilterCriteria } from "@carwatch/shared";
import { Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { SavedSearchCard } from "@/components/saved-search/saved-search-card";
import { getCurrentUser } from "@/lib/auth";
import { getSavedSearches } from "@/lib/query-saved-searches";

export default async function SavedSearchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const searches = await getSavedSearches(user.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg">Saved Searches</h1>
          <p className="text-sm text-fg-muted">Get notified the moment a matching car appears.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/browse">Build a new search</Link>
        </Button>
      </div>

      {searches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No saved searches yet"
          description="Filter listings on the Browse page, then save the search to get alerted on new matches."
          action={
            <Button asChild size="sm" className="mt-1">
              <Link href="/browse">Go to Browse</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {searches.map((s) => (
            <SavedSearchCard
              key={s.id}
              search={{
                id: s.id,
                name: s.name,
                isActive: s.isActive,
                required: s.required as FilterCriteria,
                matchCount: s._count.matches,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
