import { prisma, type Listing } from "@carwatch/database";
import { buildAlertDedupeKey } from "@carwatch/shared";
import { createAndEnqueueAlert } from "./create-alert-event";
import type { Queues } from "../queues";
import type { UpsertResult } from "../persistence/upsert-listing";

/** Raises alerts for every user watching this listing when something notable changed. */
export async function raiseWatchlistAlerts(queues: Queues, result: UpsertResult): Promise<void> {
  const { listing, priceChanged, mileageChanged, returned } = result;
  if (!priceChanged && !mileageChanged && !returned) return;

  const watchers = await prisma.watchlistItem.findMany({ where: { listingId: listing.id }, select: { userId: true } });
  if (watchers.length === 0) return;

  for (const watcher of watchers) {
    if (priceChanged) {
      const isDrop = priceChanged.newPrice < priceChanged.oldPrice;
      await createAndEnqueueAlert(queues, {
        userId: watcher.userId,
        type: isDrop ? "PRICE_DROP" : "PRICE_INCREASE",
        listingId: listing.id,
        dedupeKey: buildAlertDedupeKey({
          userId: watcher.userId,
          type: isDrop ? "PRICE_DROP" : "PRICE_INCREASE",
          listingId: listing.id,
          discriminator: priceChanged.newPrice,
        }),
        payload: { oldPrice: priceChanged.oldPrice, newPrice: priceChanged.newPrice },
      });
    }

    if (returned) {
      await createAndEnqueueAlert(queues, {
        userId: watcher.userId,
        type: "LISTING_RETURNED",
        listingId: listing.id,
        dedupeKey: buildAlertDedupeKey({ userId: watcher.userId, type: "LISTING_RETURNED", listingId: listing.id, discriminator: Date.now() }),
        payload: {},
      });
    }

    if (mileageChanged) {
      await createAndEnqueueAlert(queues, {
        userId: watcher.userId,
        type: "SIGNIFICANT_CHANGE",
        listingId: listing.id,
        dedupeKey: buildAlertDedupeKey({
          userId: watcher.userId,
          type: "SIGNIFICANT_CHANGE",
          listingId: listing.id,
          discriminator: `mileage:${mileageChanged.newMileage}`,
        }),
        payload: { field: "Mileage", oldValue: `${mileageChanged.oldMileage} km`, newValue: `${mileageChanged.newMileage} km` },
      });
    }
  }
}

/** Raises a LISTING_REMOVED alert for anyone watching a listing that just disappeared from the marketplace. */
export async function raiseListingRemovedAlerts(queues: Queues, listings: Listing[]): Promise<void> {
  for (const listing of listings) {
    const watchers = await prisma.watchlistItem.findMany({ where: { listingId: listing.id }, select: { userId: true } });
    for (const watcher of watchers) {
      await createAndEnqueueAlert(queues, {
        userId: watcher.userId,
        type: "LISTING_REMOVED",
        listingId: listing.id,
        dedupeKey: buildAlertDedupeKey({ userId: watcher.userId, type: "LISTING_REMOVED", listingId: listing.id, discriminator: Date.now() }),
        payload: {},
      });
    }
  }
}
