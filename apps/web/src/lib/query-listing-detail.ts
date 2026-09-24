import "server-only";
import { prisma } from "./db";
import { LISTING_INCLUDE } from "./query-listings";

export async function getListingDetail(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      ...LISTING_INCLUDE,
      priceHistory: { orderBy: { recordedAt: "asc" } },
      statusHistory: { orderBy: { recordedAt: "asc" } },
      mileageHistory: { orderBy: { recordedAt: "asc" } },
      changeLogs: { orderBy: { recordedAt: "desc" }, take: 10 },
    },
  });
}

export async function getSimilarListings(params: { manufacturer: string; model: string; excludeId: string }) {
  return prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      id: { not: params.excludeId },
      vehicle: { manufacturer: params.manufacturer, model: params.model },
    },
    include: LISTING_INCLUDE,
    orderBy: { firstSeenAt: "desc" },
    take: 6,
  });
}

export async function getOtherMarketplaceListings(listingId: string) {
  const matches = await prisma.duplicateMatch.findMany({
    where: {
      status: { in: ["CONFIRMED", "LIKELY"] },
      OR: [{ listingAId: listingId }, { listingBId: listingId }],
    },
    include: {
      listingA: { include: LISTING_INCLUDE },
      listingB: { include: LISTING_INCLUDE },
    },
  });

  return matches.map((m) => ({
    status: m.status,
    score: m.score,
    listing: m.listingAId === listingId ? m.listingB : m.listingA,
  }));
}
