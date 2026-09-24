import { prisma, type Provider } from "@carwatch/database";
import { parseProviderSchedulerId, providerSchedulerId } from "@carwatch/shared";
import { logger } from "./logger";
import type { Queues } from "./queues";

/** Deterministic 0..1 hash of a string, used to stagger provider schedules so they don't all fire at once. */
function stableUnitFraction(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash / 0xffffffff;
}

/**
 * Reconciles BullMQ repeatable job schedulers with the current Provider rows
 * in the database, so enabling/disabling a provider or changing its interval
 * in the settings UI takes effect without restarting the worker.
 */
export async function reconcileProviderSchedules(queues: Queues): Promise<void> {
  const providers: Provider[] = await prisma.provider.findMany();
  const desired = new Map<string, Provider>(providers.filter((p) => p.isEnabled).map((p) => [p.key, p]));

  const existingSchedulers = await queues.scrape.getJobSchedulers();
  const existingKeys = new Set(
    existingSchedulers.map((s) => parseProviderSchedulerId(s.id)).filter((key): key is string => key !== null),
  );

  for (const [key, provider] of desired) {
    const everyMs = provider.scrapeIntervalMinutes * 60_000;
    // Stagger providers deterministically across up to 20% of the interval so
    // they don't all start scraping at the exact same wall-clock moment.
    const staggerMs = Math.floor(stableUnitFraction(key) * everyMs * 0.2);
    const isNewSchedule = !existingKeys.has(key);
    await queues.scrape.upsertJobScheduler(
      providerSchedulerId(key),
      { every: everyMs, offset: staggerMs },
      { name: "scrape", data: { providerKey: key, trigger: "scheduled" } },
    );
    // `every`-based schedulers only fire after the first full interval elapses;
    // kick off an immediate run too so a newly enabled provider scrapes right away.
    if (isNewSchedule) {
      await queues.scrape.add("scrape", { providerKey: key, trigger: "scheduled" });
    }
  }

  for (const key of existingKeys) {
    if (!desired.has(key)) {
      await queues.scrape.removeJobScheduler(providerSchedulerId(key));
      logger.info("Removed scrape schedule for disabled/removed provider", { providerKey: key });
    }
  }

  logger.info("Provider schedules reconciled", { enabledProviders: [...desired.keys()] });
}
