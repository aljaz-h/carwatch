import "server-only";
import { prisma } from "./db";

export async function getRecentAlertEvents(userId: string, limit = 50) {
  return prisma.alertEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      listing: { include: { vehicle: true, provider: true } },
      savedSearch: { select: { id: true, name: true } },
    },
  });
}
