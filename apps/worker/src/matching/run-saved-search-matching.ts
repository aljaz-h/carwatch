import { prisma } from "@carwatch/database";
import { buildAlertDedupeKey, scoreListing, type FilterCriteria } from "@carwatch/shared";
import { createAndEnqueueAlert } from "../alerts/create-alert-event";
import { logger } from "../logger";
import type { Queues } from "../queues";
import { toMatchable } from "./to-matchable";

export interface PriceChange {
  oldPrice: number;
  newPrice: number;
}

/** Scores one listing against every active saved search, updates SavedSearchMatch rows, and raises alerts. */
export async function runSavedSearchMatching(queues: Queues, listingId: string, priceChange: PriceChange | null): Promise<void> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { vehicle: { include: { features: { include: { feature: true } } } }, provider: true },
  });
  if (!listing) return;

  const matchable = toMatchable(listing, listing.vehicle, listing.provider.key);
  const savedSearches = await prisma.savedSearch.findMany({ where: { isActive: true } });

  for (const ss of savedSearches) {
    const result = scoreListing(matchable, {
      required: ss.required as FilterCriteria,
      preferred: ss.preferred as FilterCriteria,
      excluded: ss.excluded as FilterCriteria,
    });

    const existingMatch = await prisma.savedSearchMatch.findUnique({
      where: { savedSearchId_listingId: { savedSearchId: ss.id, listingId } },
    });

    if (!result.isMatch) {
      if (existingMatch) {
        await prisma.savedSearchMatch.delete({ where: { id: existingMatch.id } });
      }
      continue;
    }

    await prisma.savedSearchMatch.upsert({
      where: { savedSearchId_listingId: { savedSearchId: ss.id, listingId } },
      create: {
        savedSearchId: ss.id,
        listingId,
        score: result.score,
        scoreBreakdown: { requiredChecks: result.requiredChecks, preferredChecks: result.preferredChecks } as never,
      },
      update: {
        score: result.score,
        scoreBreakdown: { requiredChecks: result.requiredChecks, preferredChecks: result.preferredChecks } as never,
        lastEvaluatedAt: new Date(),
      },
    });

    const isFirstMatch = !existingMatch;

    if (isFirstMatch && ss.notifyNewMatch && result.score >= ss.minMatchScore) {
      await createAndEnqueueAlert(queues, {
        userId: ss.userId,
        type: "NEW_MATCH",
        savedSearchId: ss.id,
        listingId,
        dedupeKey: buildAlertDedupeKey({ userId: ss.userId, type: "NEW_MATCH", savedSearchId: ss.id, listingId }),
        payload: { score: result.score, savedSearchName: ss.name },
      });
      logger.info("New saved search match", { savedSearchId: ss.id, listingId, score: result.score });
    }

    if (!isFirstMatch && priceChange && ss.notifyPriceDrop && priceChange.newPrice < priceChange.oldPrice) {
      const drop = priceChange.oldPrice - priceChange.newPrice;
      if (!ss.minPriceDropAmount || drop >= ss.minPriceDropAmount) {
        await createAndEnqueueAlert(queues, {
          userId: ss.userId,
          type: "PRICE_DROP",
          savedSearchId: ss.id,
          listingId,
          dedupeKey: buildAlertDedupeKey({
            userId: ss.userId,
            type: "PRICE_DROP",
            savedSearchId: ss.id,
            listingId,
            discriminator: priceChange.newPrice,
          }),
          payload: { oldPrice: priceChange.oldPrice, newPrice: priceChange.newPrice, savedSearchName: ss.name },
        });
      }
    }
  }
}
