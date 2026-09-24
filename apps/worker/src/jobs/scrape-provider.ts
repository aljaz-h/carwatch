import { prisma } from "@carwatch/database";
import type { ProviderRegistry } from "@carwatch/providers";
import { logger } from "../logger";
import { raiseListingRemovedAlerts, raiseWatchlistAlerts } from "../alerts/watchlist-events";
import { sweepMissingListings, upsertListing } from "../persistence/upsert-listing";
import type { Queues, ScrapeJobData } from "../queues";

export async function processScrapeJob(queues: Queues, registry: ProviderRegistry, data: ScrapeJobData): Promise<void> {
  const dbProvider = await prisma.provider.findUnique({ where: { key: data.providerKey } });
  if (!dbProvider) {
    logger.warn("Scrape job skipped: unknown provider", { providerKey: data.providerKey });
    return;
  }
  if (!dbProvider.isEnabled) {
    logger.info("Scrape job skipped: provider disabled", { providerKey: data.providerKey });
    return;
  }

  const impl = registry.get(data.providerKey);
  if (!impl) {
    await prisma.provider.update({
      where: { id: dbProvider.id },
      data: { status: "DISABLED", lastError: "No provider implementation registered for this key yet." },
    });
    logger.warn("Scrape job skipped: no implementation registered", { providerKey: data.providerKey });
    return;
  }

  const run = await prisma.providerScrapeRun.create({ data: { providerId: dbProvider.id, status: "RUNNING" } });
  const startedAt = Date.now();

  const counters = { discovered: 0, new: 0, updated: 0, unchanged: 0, removed: 0, errors: 0 };
  const seenIds = new Set<string>();
  let runFailed: Error | null = null;

  try {
    for await (const item of impl.searchListings({ maxPages: 20 })) {
      counters.discovered += 1;
      seenIds.add(item.providerListingId);

      try {
        const raw = await impl.getListing(item.providerListingId, { url: item.url });
        const normalized = impl.normalizeListing(raw);
        const result = await upsertListing(normalized, dbProvider.id);

        if (result.isNew) counters.new += 1;
        else if (result.changed) counters.updated += 1;
        else counters.unchanged += 1;

        await queues.match.add("score", { listingId: result.listing.id, priceChange: result.priceChanged });
        await raiseWatchlistAlerts(queues, result);
      } catch (itemErr) {
        // A single bad listing must never abort the whole provider run.
        counters.errors += 1;
        logger.warn("Failed to process listing", {
          providerKey: data.providerKey,
          providerListingId: item.providerListingId,
          error: itemErr instanceof Error ? itemErr.message : String(itemErr),
        });
      }
    }

    const removedListings = await sweepMissingListings(dbProvider.id, seenIds);
    counters.removed = removedListings.length;
    await raiseListingRemovedAlerts(queues, removedListings);
  } catch (err) {
    runFailed = err instanceof Error ? err : new Error(String(err));
    logger.error("Provider scrape run failed", { providerKey: data.providerKey, error: runFailed.message });
  }

  const durationMs = Date.now() - startedAt;
  const status = runFailed ? "FAILED" : counters.errors > 0 ? "PARTIAL" : "SUCCESS";

  await prisma.providerScrapeRun.update({
    where: { id: run.id },
    data: {
      finishedAt: new Date(),
      status,
      durationMs,
      listingsDiscovered: counters.discovered,
      listingsNew: counters.new,
      listingsUpdated: counters.updated,
      listingsUnchanged: counters.unchanged,
      listingsRemoved: counters.removed,
      errorsCount: counters.errors,
      errorMessage: runFailed?.message,
    },
  });

  await prisma.provider.update({
    where: { id: dbProvider.id },
    data: runFailed
      ? { status: "DOWN", lastErrorAt: new Date(), lastError: runFailed.message }
      : { status: counters.errors > 0 ? "DEGRADED" : "HEALTHY", lastSuccessAt: new Date(), lastError: null },
  });

  logger.info("Provider scrape run finished", { providerKey: data.providerKey, status, durationMs, ...counters });
}
