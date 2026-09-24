import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { AlertEventRow } from "@/components/activity/alert-event-row";
import { DashboardSection } from "@/components/dashboard/section";
import { MarketActivityBar } from "@/components/dashboard/market-activity-bar";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/vehicle/listing-card";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/query-dashboard";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { newMatches, priceDropListings, watchlistEvents, stats } = await getDashboardData(user.id);
  const isAllQuiet = newMatches.length === 0 && priceDropListings.length === 0 && watchlistEvents.length === 0;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">
          Welcome back{user.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-sm text-fg-muted">Here&apos;s what changed since you last looked.</p>
      </div>

      <MarketActivityBar {...stats} />

      {isAllQuiet && (
        <EmptyState
          icon={Sparkles}
          title="You're all caught up"
          description="No new matches, price drops, or watchlist changes right now. Save a search or watch a listing to start tracking."
        />
      )}

      {newMatches.length > 0 && (
        <DashboardSection title="New matches" viewAllHref="/saved-searches">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {newMatches.map((m) => (
              <ListingCard key={m.id} listing={m.listing} matchScore={m.score} />
            ))}
          </div>
        </DashboardSection>
      )}

      {priceDropListings.length > 0 && (
        <DashboardSection title="Price drops" viewAllHref="/browse?sort=recently_reduced">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {priceDropListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </DashboardSection>
      )}

      {watchlistEvents.length > 0 && (
        <DashboardSection title="Watchlist changes" viewAllHref="/watchlist">
          <div className="flex flex-col gap-2">
            {watchlistEvents.map((e) => (
              <AlertEventRow key={e.id} event={e} />
            ))}
          </div>
        </DashboardSection>
      )}
    </div>
  );
}
