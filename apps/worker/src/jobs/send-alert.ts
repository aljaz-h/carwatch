import { prisma } from "@carwatch/database";
import {
  buildChannel,
  buildGoodDealPayload,
  buildListingReturnedPayload,
  buildNewMatchPayload,
  buildPriceDropPayload,
  buildSignificantChangePayload,
  createMailerFromEnv,
  type NotificationPayload,
} from "@carwatch/notifications";
import { isPlaceholderImageUri } from "@carwatch/shared";
import { env } from "../env";
import { logger } from "../logger";
import type { AlertJobData } from "../queues";

const mailer = createMailerFromEnv();

function resolveImageUrl(images: string[]): string | undefined {
  const first = images[0];
  if (!first || isPlaceholderImageUri(first)) return undefined;
  return first;
}

async function buildPayload(alertEvent: {
  type: string;
  payload: unknown;
  listingId: string | null;
}): Promise<NotificationPayload | null> {
  const payload = (alertEvent.payload ?? {}) as Record<string, unknown>;

  if (!alertEvent.listingId) return null;
  const listing = await prisma.listing.findUnique({ where: { id: alertEvent.listingId } });
  if (!listing) return null;

  const summary = {
    title: listing.title,
    price: listing.price,
    mileage: listing.mileage ?? undefined,
    url: `${env.webBaseUrl}/listings/${listing.id}`,
    imageUrl: resolveImageUrl(listing.images),
  };

  switch (alertEvent.type) {
    case "NEW_MATCH":
      return buildNewMatchPayload(summary, Number(payload.score ?? 0), String(payload.savedSearchName ?? "Saved search"));
    case "PRICE_DROP":
      return buildPriceDropPayload(summary, Number(payload.oldPrice), Number(payload.newPrice));
    case "PRICE_INCREASE":
      return buildPriceDropPayload(summary, Number(payload.oldPrice), Number(payload.newPrice));
    case "LISTING_RETURNED":
      return buildListingReturnedPayload(summary, Number(payload.inactiveDays ?? 0));
    case "LISTING_REMOVED":
      return {
        type: "LISTING_REMOVED",
        title: `Listing removed: ${listing.title}`,
        body: "This listing is no longer available on the marketplace.",
        url: summary.url,
        imageUrl: summary.imageUrl,
      };
    case "SIGNIFICANT_CHANGE":
      return buildSignificantChangePayload(summary, String(payload.field ?? "Listing"), String(payload.oldValue ?? ""), String(payload.newValue ?? ""));
    case "GOOD_DEAL":
      return buildGoodDealPayload(summary, Number(payload.percentBelowMarket ?? 0));
    default:
      return null;
  }
}

export async function processAlertJob(data: AlertJobData): Promise<void> {
  const alertEvent = await prisma.alertEvent.findUnique({ where: { id: data.alertEventId } });
  if (!alertEvent || alertEvent.status !== "PENDING") return;

  const payload = await buildPayload(alertEvent);
  if (!payload) {
    await prisma.alertEvent.update({ where: { id: alertEvent.id }, data: { status: "SKIPPED" } });
    return;
  }

  const channels = await prisma.notificationChannel.findMany({ where: { userId: alertEvent.userId, isEnabled: true } });

  if (channels.length === 0) {
    await prisma.alertEvent.update({ where: { id: alertEvent.id }, data: { status: "SKIPPED" } });
    return;
  }

  const results: Record<string, { status: string; error?: string }> = {};
  let anySent = false;

  for (const channelRow of channels) {
    if (channelRow.type === "EMAIL" && !mailer) {
      results[channelRow.id] = { status: "FAILED", error: "SMTP not configured" };
      continue;
    }
    try {
      const channel = buildChannel(channelRow, { mailer: mailer! });
      const result = await channel.send(payload);
      results[channelRow.id] = result.ok ? { status: "SENT" } : { status: "FAILED", error: result.error };
      if (result.ok) anySent = true;
    } catch (err) {
      results[channelRow.id] = { status: "FAILED", error: err instanceof Error ? err.message : String(err) };
      logger.warn("Alert delivery failed", { channelId: channelRow.id, alertEventId: alertEvent.id });
    }
  }

  await prisma.alertEvent.update({
    where: { id: alertEvent.id },
    data: {
      status: anySent ? "SENT" : "FAILED",
      channelResults: results as never,
      deliveredAt: anySent ? new Date() : null,
    },
  });
}
