import { formatPrice } from "@carwatch/shared";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ListingWithRelations } from "@/lib/query-listings";

export function OtherMarketplaces({ offers }: { offers: { status: string; score: number; listing: ListingWithRelations }[] }) {
  if (offers.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {offers.map(({ status, listing }) => (
        <Link
          key={listing.id}
          href={`/listings/${listing.id}`}
          className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3.5 py-2.5 transition-colors hover:border-border-strong"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-fg">{listing.provider.name}</span>
            <Badge variant={status === "CONFIRMED" ? "accent" : "outline"}>{status === "CONFIRMED" ? "Confirmed match" : "Likely match"}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-fg">{formatPrice(listing.price)}</span>
            <ExternalLink className="h-3.5 w-3.5 text-fg-subtle" />
          </div>
        </Link>
      ))}
    </div>
  );
}
