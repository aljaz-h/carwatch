import type { FilterCriteria } from "@carwatch/shared";
import { Search } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AlertRulesForm } from "@/components/saved-search/alert-rules-form";
import { CriteriaSummary } from "@/components/saved-search/criteria-summary";
import { SavedSearchMatchCard } from "@/components/saved-search/match-card";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getSavedSearchWithMatches } from "@/lib/query-saved-searches";

export default async function SavedSearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const result = await getSavedSearchWithMatches(id, user.id);
  if (!result) notFound();
  const { savedSearch, matches } = result;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">{savedSearch.name}</h1>
        <div className="mt-2">
          <CriteriaSummary criteria={savedSearch.required as FilterCriteria} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-fg">
            {matches.length} match{matches.length === 1 ? "" : "es"}
          </h2>
          {matches.length === 0 ? (
            <EmptyState icon={Search} title="No matches yet" description="We'll notify you as soon as a listing meets your required criteria." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {matches.map((m) => {
                const breakdown = m.scoreBreakdown as { requiredChecks: never[]; preferredChecks: never[] };
                return (
                  <SavedSearchMatchCard
                    key={m.id}
                    listing={m.listing}
                    score={m.score}
                    requiredChecks={breakdown.requiredChecks ?? []}
                    preferredChecks={breakdown.preferredChecks ?? []}
                  />
                );
              })}
            </div>
          )}
        </div>

        <AlertRulesForm
          savedSearchId={savedSearch.id}
          initial={{
            notifyNewMatch: savedSearch.notifyNewMatch,
            minMatchScore: savedSearch.minMatchScore,
            notifyPriceDrop: savedSearch.notifyPriceDrop,
            minPriceDropAmount: savedSearch.minPriceDropAmount,
            maxPrice: savedSearch.maxPrice,
          }}
        />
      </div>
    </div>
  );
}
