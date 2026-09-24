/**
 * BullMQ queue names and job payload shapes shared between the worker
 * (which processes jobs) and the web app (which needs to enqueue a manual
 * "run now" scrape and read back job/queue state for the diagnostics UI).
 * Keeping these in one place avoids the queue name or payload shape drifting
 * between the two processes.
 */
export const QUEUE_NAMES = {
  scrape: "carwatch-scrape",
  match: "carwatch-match",
  alert: "carwatch-alert",
} as const;

export type ScrapeRunTriggerKind = "scheduled" | "manual";

/**
 * Base delay for the scrape queue's exponential backoff (attempts=5). Kept
 * here (not just inline in the worker's Queue options) so the web app's
 * diagnostics UI can estimate "retrying in Xs" from a delayed job's public
 * `attemptsMade`/`finishedOn` fields using BullMQ's own formula
 * (`round(2^(attemptsMade-1) * base)`), without reading BullMQ's internal,
 * version-specific packed Redis sorted-set scores.
 */
export const SCRAPE_BACKOFF_BASE_DELAY_MS = 60_000;

export function estimateExponentialBackoffDelayMs(attemptsMade: number, baseDelayMs = SCRAPE_BACKOFF_BASE_DELAY_MS): number {
  return Math.round(2 ** (attemptsMade - 1) * baseDelayMs);
}

export interface ScrapeJobData {
  providerKey: string;
  trigger?: ScrapeRunTriggerKind;
}

export interface MatchJobData {
  listingId: string;
  priceChange?: { oldPrice: number; newPrice: number } | null;
}

export interface AlertJobData {
  alertEventId: string;
}

const PROVIDER_SCHEDULER_PREFIX = "provider:";

/** BullMQ job scheduler id for a provider's recurring scrape. */
export function providerSchedulerId(providerKey: string): string {
  return `${PROVIDER_SCHEDULER_PREFIX}${providerKey}`;
}

/** Recovers the provider key from a scheduler id built by `providerSchedulerId`, or null if it doesn't match. */
export function parseProviderSchedulerId(schedulerId: string | undefined | null): string | null {
  if (!schedulerId || !schedulerId.startsWith(PROVIDER_SCHEDULER_PREFIX)) return null;
  return schedulerId.slice(PROVIDER_SCHEDULER_PREFIX.length);
}

/** BullMQ jobId for a manually-triggered scrape, unique per click so retries of a stale job never collide. */
export function manualScrapeJobId(providerKey: string): string {
  return `manual-${providerKey}-${Date.now()}`;
}
