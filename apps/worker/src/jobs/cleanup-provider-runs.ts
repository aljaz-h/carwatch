import { prisma } from "@carwatch/database";
import { env } from "../env";
import { logger } from "../logger";

/**
 * Deletes provider scrape-run history older than PROVIDER_RUN_RETENTION_DAYS
 * so diagnostics history stays useful for troubleshooting without the table
 * growing forever. The Provider row itself (and its rolling counters like
 * consecutiveFailures) is untouched — only the per-run history rows age out.
 */
export async function cleanupOldProviderRuns(): Promise<void> {
  const retentionDays = env.providerRunRetentionDays;
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    logger.warn("Skipping provider run cleanup: invalid PROVIDER_RUN_RETENTION_DAYS", { retentionDays });
    return;
  }

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await prisma.providerScrapeRun.deleteMany({
    where: { startedAt: { lt: cutoff }, status: { not: "RUNNING" } },
  });

  if (result.count > 0) {
    logger.info("Cleaned up old provider scrape runs", { deleted: result.count, retentionDays });
  }
}
