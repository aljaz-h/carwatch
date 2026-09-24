import "server-only";
import { prisma } from "./db";
import { LISTING_INCLUDE } from "./query-listings";

export async function getSavedSearches(userId: string) {
  const searches = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { matches: true } } },
  });
  return searches;
}

export async function getSavedSearchWithMatches(id: string, userId: string) {
  const savedSearch = await prisma.savedSearch.findFirst({ where: { id, userId } });
  if (!savedSearch) return null;

  const matches = await prisma.savedSearchMatch.findMany({
    where: { savedSearchId: id },
    orderBy: { score: "desc" },
    include: { listing: { include: LISTING_INCLUDE } },
  });

  return { savedSearch, matches };
}
