import "server-only";
import { prisma } from "./db";
import { LISTING_INCLUDE } from "./query-listings";

export async function getWatchlist(userId: string) {
  return prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: LISTING_INCLUDE } },
  });
}
