import { QUEUE_NAMES, SCRAPE_BACKOFF_BASE_DELAY_MS, type AlertJobData, type MatchJobData, type ScrapeJobData } from "@carwatch/shared";
import { Queue } from "bullmq";
import type { RedisConnection } from "./redis";

export { QUEUE_NAMES };
export type { AlertJobData, MatchJobData, ScrapeJobData };

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 2000 },
} as const;

// Scraping is network I/O against a third party and is expected to fail
// transiently (rate limits, brief outages). Give it more attempts with a
// slower, minutes-scale backoff than the lightweight DB-only match/alert
// jobs, so "the worker will retry automatically" (shown in the diagnostics
// UI) means something on a realistic timescale.
const scrapeJobOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: SCRAPE_BACKOFF_BASE_DELAY_MS },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 2000 },
} as const;

export function createQueues(connection: RedisConnection) {
  return {
    scrape: new Queue<ScrapeJobData>(QUEUE_NAMES.scrape, { connection, defaultJobOptions: scrapeJobOptions }),
    match: new Queue<MatchJobData>(QUEUE_NAMES.match, { connection, defaultJobOptions }),
    alert: new Queue<AlertJobData>(QUEUE_NAMES.alert, { connection, defaultJobOptions }),
  };
}

export type Queues = ReturnType<typeof createQueues>;
