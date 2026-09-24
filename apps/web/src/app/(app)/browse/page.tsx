import { CarFront } from "lucide-react";
import { Pagination } from "@/components/browse/pagination";
import { SearchBox } from "@/components/browse/search-box";
import { BrowseToolbar } from "@/components/browse/browse-toolbar";
import { EmptyState } from "@/components/empty-state";
import { ActiveFilterChips } from "@/components/filters/active-filter-chips";
import { FilterSidebar } from "@/components/filters/filter-sidebar";
import { ListingCard } from "@/components/vehicle/listing-card";
import { getCurrentUser } from "@/lib/auth";
import { browseParamsToCriteria, suggestSavedSearchName } from "@/lib/browse-to-criteria";
import { prisma } from "@/lib/db";
import { getBrowseListings, getFilterFacets } from "@/lib/query-listings";
import { isBrowseFiltered, parseBrowseParams, type RawSearchParams } from "@/lib/search-params";

export default async function BrowsePage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sp = await searchParams;
  const params = parseBrowseParams(sp);

  const [{ listings, total, pageCount }, facets, user] = await Promise.all([
    getBrowseListings(params),
    getFilterFacets(),
    getCurrentUser(),
  ]);

  const watchedIds = user
    ? new Set(
        (
          await prisma.watchlistItem.findMany({
            where: { userId: user.id, listingId: { in: listings.map((l) => l.id) } },
            select: { listingId: true },
          })
        ).map((w) => w.listingId),
      )
    : new Set<string>();

  const criteria = browseParamsToCriteria(params);
  const providerNames = Object.fromEntries(facets.providers.map((p) => [p.id, p.name]));
  const activeFilterCount = Object.entries(criteria).filter(([k]) => k !== "query").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">Browse</h1>
        <p className="text-sm text-fg-muted">Search every tracked marketplace in one place.</p>
      </div>

      <div className="max-w-xl">
        <SearchBox />
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-border bg-surface p-4">
            <FilterSidebar facets={facets} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <BrowseToolbar
            total={total}
            view={params.view}
            facets={facets}
            activeFilterCount={activeFilterCount}
            criteria={criteria}
            suggestedName={suggestSavedSearchName(criteria)}
          />

          <ActiveFilterChips providerNames={providerNames} />

          {listings.length === 0 ? (
            <EmptyState
              icon={CarFront}
              title="No listings match these filters"
              description={
                isBrowseFiltered(params)
                  ? "Try widening your price, mileage, or year range."
                  : "New listings will show up here once a scrape has run."
              }
            />
          ) : params.view === "list" ? (
            <div className="flex flex-col gap-2.5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} view="list" isWatched={watchedIds.has(listing.id)} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} view="grid" isWatched={watchedIds.has(listing.id)} />
              ))}
            </div>
          )}

          <Pagination page={params.page} pageCount={pageCount} />
        </div>
      </div>
    </div>
  );
}
