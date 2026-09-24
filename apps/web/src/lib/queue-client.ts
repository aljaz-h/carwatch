import "server-only";
import { QUEUE_NAMES, type AlertJobData, type MatchJobData, type ScrapeJobData } from "@carwatch/shared";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

/**
 * Read/write access to the same BullMQ queues the worker processes, so the
 * web app can enqueue a manual "run now" scrape and inspect live job/queue
 * scheduler state for the provider diagnostics UI. The web app never runs a
 * `Worker` (it doesn't process jobs) — only `Queue`, which is safe to share
 * a Redis connection across Next.js's persistent Node process the same way
 * the Prisma client is shared.
 */
function createConnection() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new Redis(url, { maxRetriesPerRequest: null });
}

interface QueueClients {
  connection: Redis;
  scrape: Queue<ScrapeJobData>;
  match: Queue<MatchJobData>;
  alert: Queue<AlertJobData>;
}

const globalForQueues = globalThis as unknown as { carwatchQueues?: QueueClients };

function createQueueClients(): QueueClients {
  const connection = createConnection();
  return {
    connection,
    scrape: new Queue<ScrapeJobData>(QUEUE_NAMES.scrape, { connection }),
    match: new Queue<MatchJobData>(QUEUE_NAMES.match, { connection }),
    alert: new Queue<AlertJobData>(QUEUE_NAMES.alert, { connection }),
  };
}

export const queueClients = globalForQueues.carwatchQueues ?? createQueueClients();

if (process.env.NODE_ENV !== "production") {
  globalForQueues.carwatchQueues = queueClients;
}
