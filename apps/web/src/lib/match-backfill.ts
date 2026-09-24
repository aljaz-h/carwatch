import "server-only";
import type { FilterCriteria } from "@carwatch/shared";
import { scoreListing } from "@carwatch/shared";
import { prisma } from "./db";
import { LISTING_INCLUDE } from "./query-listings";

/**
 * Scores every currently active listing against a saved search right after
 * it's created/edited, so the user sees matches immediately instead of
 * waiting for the next scrape cycle (which only (re)scores touched listings).
 */
export async function backfillSavedSearchMatches(savedSearchId: string) {
  const savedSearch = await prisma.savedSearch.findUnique({ where: { id: savedSearchId } });
  if (!savedSearch) return;

  const listings = await prisma.listing.findMany({ where: { status: "ACTIVE" }, include: LISTING_INCLUDE });

  for (const listing of listings) {
    const result = scoreListing(
      {
        listingId: listing.id,
        price: listing.price,
        mileage: listing.mileage ?? undefined,
        manufacturer: listing.vehicle.manufacturer,
        model: listing.vehicle.model,
        generation: listing.vehicle.generation ?? undefined,
        variant: listing.vehicle.variant ?? undefined,
        year: listing.vehicle.year ?? undefined,
        powerHp: listing.vehicle.powerHp ?? undefined,
        engineCapacity: listing.vehicle.engineCapacity ?? undefined,
        fuelType: listing.vehicle.fuelType ?? undefined,
        transmission: listing.vehicle.transmission ?? undefined,
        drivetrain: listing.vehicle.drivetrain ?? undefined,
        bodyType: listing.vehicle.bodyType ?? undefined,
        features: listing.vehicle.features.map((f) => f.feature.key),
        locationCountry: listing.locationCountry ?? undefined,
        locationRegion: listing.locationRegion ?? undefined,
        providerKey: listing.provider.key,
        sellerType: listing.sellerType,
      },
      {
        required: savedSearch.required as FilterCriteria,
        preferred: savedSearch.preferred as FilterCriteria,
        excluded: savedSearch.excluded as FilterCriteria,
      },
    );

    if (!result.isMatch) continue;

    await prisma.savedSearchMatch.upsert({
      where: { savedSearchId_listingId: { savedSearchId, listingId: listing.id } },
      create: {
        savedSearchId,
        listingId: listing.id,
        score: result.score,
        scoreBreakdown: { requiredChecks: result.requiredChecks, preferredChecks: result.preferredChecks } as never,
      },
      update: {
        score: result.score,
        scoreBreakdown: { requiredChecks: result.requiredChecks, preferredChecks: result.preferredChecks } as never,
        lastEvaluatedAt: new Date(),
      },
    });
  }
}
