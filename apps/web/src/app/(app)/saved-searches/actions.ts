"use server";

import type { FilterCriteria } from "@carwatch/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { backfillSavedSearchMatches } from "@/lib/match-backfill";

async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.id;
}

export async function createSavedSearchAction(input: {
  name: string;
  required: FilterCriteria;
  preferred?: FilterCriteria;
  excluded?: FilterCriteria;
}) {
  const userId = await requireUserId();
  const savedSearch = await prisma.savedSearch.create({
    data: {
      userId,
      name: input.name || "Untitled search",
      required: input.required as never,
      preferred: (input.preferred ?? {}) as never,
      excluded: (input.excluded ?? {}) as never,
    },
  });
  await backfillSavedSearchMatches(savedSearch.id);
  revalidatePath("/saved-searches");
  return savedSearch.id;
}

export async function updateSavedSearchAction(
  id: string,
  input: Partial<{
    name: string;
    isActive: boolean;
    required: FilterCriteria;
    preferred: FilterCriteria;
    excluded: FilterCriteria;
    notifyNewMatch: boolean;
    minMatchScore: number;
    notifyPriceDrop: boolean;
    minPriceDropAmount: number | null;
  }>,
) {
  const userId = await requireUserId();
  await prisma.savedSearch.updateMany({
    where: { id, userId },
    data: input as never,
  });
  if (input.required || input.preferred || input.excluded) {
    await backfillSavedSearchMatches(id);
  }
  revalidatePath("/saved-searches");
  revalidatePath(`/saved-searches/${id}`);
}

export async function deleteSavedSearchAction(id: string) {
  const userId = await requireUserId();
  await prisma.savedSearch.deleteMany({ where: { id, userId } });
  revalidatePath("/saved-searches");
}
