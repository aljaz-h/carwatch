"use client";

import { formatMileage, formatPrice, formatRelativeAge } from "@carwatch/shared";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { toggleWatchlistAction } from "@/app/(app)/listings/[id]/actions";
import { Badge } from "@/components/ui/badge";
import type { ListingWithRelations } from "@/lib/query-listings";
import { VehicleImage } from "./vehicle-image";

export function WatchlistItemCard({ listing, note }: { listing: ListingWithRelations; note?: string | null }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { vehicle } = listing;
  const hasPriceDrop = listing.originalPrice !== null && listing.originalPrice > listing.price;
  const title = `${vehicle.manufacturer} ${vehicle.model}`;

  const statusLabel =
    listing.status === "ACTIVE" ? "Active" : listing.status === "INACTIVE" ? "Unavailable" : listing.status === "SOLD" ? "Sold" : listing.status;

  return (
    <div className="flex gap-4 rounded-lg border border-border bg-surface p-3">
      <Link href={`/listings/${listing.id}`} className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md">
        <VehicleImage src={listing.images[0]} alt={title} manufacturer={vehicle.manufacturer} className="h-full w-full" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/listings/${listing.id}`} className="truncate text-sm font-semibold text-fg hover:text-accent">
              {title}
            </Link>
            <p className="text-xs text-fg-subtle">
              {vehicle.year} · {listing.mileage !== null ? formatMileage(listing.mileage) : "—"}
            </p>
          </div>
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await toggleWatchlistAction(listing.id);
                toast.success("Removed from watchlist");
                router.refresh();
              })
            }
            className="shrink-0 rounded p-1 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-danger"
            aria-label="Remove from watchlist"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-fg">{formatPrice(listing.price)}</span>
          {hasPriceDrop && listing.originalPrice && (
            <>
              <span className="text-xs text-fg-subtle line-through">{formatPrice(listing.originalPrice)}</span>
              <span className="text-xs font-medium text-success">↓ {formatPrice(listing.originalPrice - listing.price)}</span>
            </>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-subtle">
          <Badge variant={listing.status === "ACTIVE" ? "success" : "warning"}>{statusLabel}</Badge>
          <span>{listing.provider.name}</span>
          <span>First seen {formatRelativeAge(listing.firstSeenAt.toISOString())}</span>
        </div>
        {note && <p className="text-xs italic text-fg-subtle">“{note}”</p>}
      </div>
    </div>
  );
}
