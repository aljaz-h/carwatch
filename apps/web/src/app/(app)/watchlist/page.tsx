import { Star } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { WatchlistItemCard } from "@/components/vehicle/watchlist-item-card";
import { getCurrentUser } from "@/lib/auth";
import { getWatchlist } from "@/lib/query-watchlist";

export default async function WatchlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await getWatchlist(user.id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">Watchlist</h1>
        <p className="text-sm text-fg-muted">Cars you&apos;re tracking individually.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Nothing on your watchlist yet"
          description="Open a listing and hit Watch to track its price and availability over time."
          action={
            <Button asChild size="sm" className="mt-1">
              <Link href="/browse">Browse listings</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {items.map((item) => (
            <WatchlistItemCard key={item.id} listing={item.listing} note={item.note} />
          ))}
        </div>
      )}
    </div>
  );
}
