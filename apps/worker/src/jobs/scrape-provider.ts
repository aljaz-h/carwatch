import { prisma } from "@carwatch/database";
import type { ProviderRegistry } from "@carwatch/providers";
import { classifyProviderError, type ScrapePhase } from "@carwatch/shared";
import type { Job } from "bullmq";
import { raiseListingRemovedAlerts, raiseWatchlistAlerts } from "../alerts/watchlist-events";
import { logger } from "../logger";
import { sweepMissingListings, upsertListing } from "../persistence/upsert-listing";
import type { Queues, ScrapeJobData } from "../queues";

const MAX_RUN_LOG_ENTRIES = 40;
/** Below this many listings in the trailing successful runs, don't bother flagging anomalies — too small a sample to mean anything. */
const MIN_BASELINE_FOR_ANOMALY_CHECK = 5;
/** A run finding fewer than this fraction of the recent average is "suspicious" rather than just a quiet day. */
const ANOMALY_RATIO_THRESHOLD = 0.3;

interface RunLogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
}

class RunLogger {
  private readonly entries: RunLogEntry[] = [];

  push(level: RunLogEntry["level"], message: string): void {
    this.entries.push({ ts: new Date().toISOString(), level, message });
    if (this.entries.length > MAX_RUN_LOG_ENTRIES) this.entries.shift();
  }

  toJSON(): RunLogEntry[] {
    return this.entries;
  }
}

export async function processScrapeJob(queues: Queues, registry: ProviderRegistry, job: Job<ScrapeJobData>): Promise<void> {
  const data = job.data;
  const trigger = data.trigger === "manual" ? "MANUAL" : "SCHEDULED";

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

  const runLog = new RunLogger();
  runLog.push("info", `Scrape started (${trigger.toLowerCase()} trigger)`);

  const run = await prisma.providerScrapeRun.create({
    data: { providerId: dbProvider.id, status: "RUNNING", trigger, jobId: job.id, retryCount: job.attemptsMade },
  });
  const startedAt = Date.now();
  await prisma.provider.update({ where: { id: dbProvider.id }, data: { lastAttemptAt: new Date() } });

  // Baseline from recent clean runs, captured before this run starts, so a
  // suddenly-quiet marketplace (vs. a genuinely broken parser) can be told
  // apart from "business as usual".
  const recentSuccessfulRuns = await prisma.providerScrapeRun.findMany({
    where: { providerId: dbProvider.id, status: "SUCCESS", isSuspicious: false },
    orderBy: { startedAt: "desc" },
    take: 3,
    select: { listingsDiscovered: true },
  });
  const baselineAvg =
    recentSuccessfulRuns.length > 0
      ? recentSuccessfulRuns.reduce((sum, r) => sum + r.listingsDiscovered, 0) / recentSuccessfulRuns.length
      : 0;

  const counters = { discovered: 0, new: 0, updated: 0, unchanged: 0, removed: 0, errors: 0 };
  const seenIds = new Set<string>();

  const finalizeFailure = async (err: unknown, phase: ScrapePhase) => {
    const classified = classifyProviderError(err, { phase, providerName: dbProvider.name });
    runLog.push("error", classified.userMessage);
    const durationMs = Date.now() - startedAt;

    await prisma.providerScrapeRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        status: "FAILED",
        durationMs,
        listingsDiscovered: counters.discovered,
        listingsNew: counters.new,
        listingsUpdated: counters.updated,
        listingsUnchanged: counters.unchanged,
        listingsRemoved: counters.removed,
        errorsCount: counters.errors + 1,
        errorMessage: classified.userMessage,
        errorType: classified.errorType,
        errorDetail: classified.technicalDetail,
        httpStatus: classified.httpStatus,
        logs: runLog.toJSON() as never,
      },
    });

    await prisma.provider.update({
      where: { id: dbProvider.id },
      data: { status: "DOWN", lastErrorAt: new Date(), lastError: classified.userMessage },
    });

    logger.error("Provider scrape run failed", {
      providerKey: data.providerKey,
      errorType: classified.errorType,
      error: classified.technicalDetail,
      attempt: job.attemptsMade,
    });

    return classified;
  };

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
        const classified = classifyProviderError(itemErr, { phase: "persist", providerName: dbProvider.name });
        runLog.push("warn", `Listing ${item.providerListingId}: ${classified.technicalDetail}`);
        logger.warn("Failed to process listing", {
          providerKey: data.providerKey,
          providerListingId: item.providerListingId,
          error: classified.technicalDetail,
        });
      }

      if (counters.discovered % 100 === 0) {
        runLog.push("info", `${counters.discovered} listings processed so far`);
      }
    }

    runLog.push("info", `Listings found: ${counters.discovered}`);

    const removedListings = await sweepMissingListings(dbProvider.id, seenIds);
    counters.removed = removedListings.length;
    await raiseListingRemovedAlerts(queues, removedListings);
    runLog.push("info", `Persistence completed (${counters.new} new, ${counters.updated} updated, ${counters.removed} unavailable)`);
  } catch (err) {
    await finalizeFailure(err, "search");
    // Rethrow (after recording the failed run) so BullMQ retries this job
    // itself with exponential backoff, per the queue's job options.
    throw err;
  }

  const isSuspicious =
    baselineAvg >= MIN_BASELINE_FOR_ANOMALY_CHECK && counters.discovered < baselineAvg * ANOMALY_RATIO_THRESHOLD;
  if (isSuspicious) {
    runLog.push(
      "warn",
      `Found only ${counters.discovered} listings vs a recent average of ~${Math.round(baselineAvg)} — the marketplace may have changed its page structure.`,
    );
  }

  const durationMs = Date.now() - startedAt;
  const status = isSuspicious || counters.errors > 0 ? "PARTIAL" : "SUCCESS";
  const errorMessage = isSuspicious
    ? `${dbProvider.name} returned successfully but CarWatch detected an unexpected page structure. Expected listing elements were found in much smaller numbers than usual. This may indicate that ${dbProvider.name} changed its HTML.`
    : null;

  runLog.push("info", `Scrape completed (${status.toLowerCase()}) in ${(durationMs / 1000).toFixed(1)}s`);

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
      isSuspicious,
      errorType: isSuspicious ? "PARSER_ANOMALY" : null,
      errorMessage,
      logs: runLog.toJSON() as never,
    },
  });

  await prisma.provider.update({
    where: { id: dbProvider.id },
    data: {
      status: isSuspicious || counters.errors > 0 ? "DEGRADED" : "HEALTHY",
      lastSuccessAt: new Date(),
      lastError: null,
      consecutiveFailures: 0,
    },
  });

  logger.info("Provider scrape run finished", { providerKey: data.providerKey, status, durationMs, isSuspicious, ...counters });
}
