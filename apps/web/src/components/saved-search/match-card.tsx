import type { ListingWithRelations } from "@/lib/query-listings";
import { ListingCard } from "@/components/vehicle/listing-card";
import { MatchBreakdown } from "./match-breakdown";

interface Check {
  key: string;
  label: string;
  passed: boolean;
}

export function SavedSearchMatchCard({
  listing,
  score,
  requiredChecks,
  preferredChecks,
}: {
  listing: ListingWithRelations;
  score: number;
  requiredChecks: Check[];
  preferredChecks: Check[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <ListingCard listing={listing} matchScore={score} className="border-none bg-transparent p-0 hover:bg-transparent" />
      <div className="border-t border-border pt-3">
        <MatchBreakdown score={score} requiredChecks={requiredChecks} preferredChecks={preferredChecks} />
      </div>
    </div>
  );
}
