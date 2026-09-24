import { prisma } from "@carwatch/database";
import type { AlertType } from "@carwatch/shared";
import type { Queues } from "../queues";

/**
 * Creates an AlertEvent if one doesn't already exist for this dedupe key,
 * then enqueues delivery. The unique constraint on `dedupeKey` is the source
 * of truth for "already alerted" — this function is safe to call repeatedly
 * for the same underlying event.
 */
export async function createAndEnqueueAlert(
  queues: Queues,
  params: {
    userId: string;
    type: AlertType;
    dedupeKey: string;
    savedSearchId?: string;
    listingId?: string;
    payload: Record<string, unknown>;
  },
): Promise<{ created: boolean; alertEventId: string }> {
  try {
    const event = await prisma.alertEvent.create({
      data: {
        userId: params.userId,
        type: params.type,
        savedSearchId: params.savedSearchId,
        listingId: params.listingId,
        dedupeKey: params.dedupeKey,
        payload: params.payload as never,
        status: "PENDING",
      },
    });
    await queues.alert.add("deliver", { alertEventId: event.id });
    return { created: true, alertEventId: event.id };
  } catch (err) {
    const isDuplicate = typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
    if (isDuplicate) {
      const existing = await prisma.alertEvent.findUnique({ where: { dedupeKey: params.dedupeKey } });
      return { created: false, alertEventId: existing?.id ?? "" };
    }
    throw err;
  }
}
