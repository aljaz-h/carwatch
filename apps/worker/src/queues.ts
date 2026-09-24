import { Queue } from "bullmq";
import type { RedisConnection } from "./redis";

export const QUEUE_NAMES = {
  scrape: "carwatch-scrape",
  match: "carwatch-match",
  alert: "carwatch-alert",
} as const;

export interface ScrapeJobData {
  providerKey: string;
}

export interface MatchJobData {
  listingId: string;
  priceChange?: { oldPrice: number; newPrice: number } | null;
}

export interface AlertJobData {
  alertEventId: string;
}

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 2000 },
} as const;

export function createQueues(connection: RedisConnection) {
  return {
    scrape: new Queue<ScrapeJobData>(QUEUE_NAMES.scrape, { connection, defaultJobOptions }),
    match: new Queue<MatchJobData>(QUEUE_NAMES.match, { connection, defaultJobOptions }),
    alert: new Queue<AlertJobData>(QUEUE_NAMES.alert, { connection, defaultJobOptions }),
  };
}

export type Queues = ReturnType<typeof createQueues>;
