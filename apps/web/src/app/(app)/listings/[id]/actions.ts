"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function toggleWatchlistAction(listingId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });

  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.watchlistItem.create({ data: { userId: user.id, listingId } });
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/watchlist");
  revalidatePath("/browse");
  return { watched: !existing };
}
