import "server-only";
import { prisma } from "./db";
import { LISTING_INCLUDE } from "./query-listings";

export async function getDashboardData(userId: string) {
  const [newMatches, priceDrops, watchlistIds, providers, totalActive, addedLast24h] = await Promise.all([
    prisma.savedSearchMatch.findMany({
      where: { savedSearch: { userId, isActive: true } },
      orderBy: { firstMatchedAt: "desc" },
      take: 6,
      include: { listing: { include: LISTING_INCLUDE }, savedSearch: { select: { name: true } } },
    }),
    prisma.listing.findMany({
      where: { status: "ACTIVE", originalPrice: { not: null } },
      include: LISTING_INCLUDE,
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.watchlistItem.findMany({ where: { userId }, select: { listingId: true } }),
    prisma.provider.findMany(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.listing.count({ where: { firstSeenAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);

  const priceDropListings = priceDrops.filter((l) => l.originalPrice !== null && l.originalPrice > l.price).slice(0, 6);

  const watchlistListingIds = watchlistIds.map((w) => w.listingId);
  const watchlistEvents =
    watchlistListingIds.length > 0
      ? await prisma.alertEvent.findMany({
          where: { userId, listingId: { in: watchlistListingIds } },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { listing: { include: { vehicle: true, provider: true } }, savedSearch: { select: { id: true, name: true } } },
        })
      : [];

  const healthyProviders = providers.filter((p) => p.isEnabled && p.status === "HEALTHY").length;

  return {
    newMatches,
    priceDropListings,
    watchlistEvents,
    stats: {
      totalActive,
      addedLast24h,
      healthyProviders,
      totalProviders: providers.filter((p) => p.isEnabled).length,
    },
  };
}
