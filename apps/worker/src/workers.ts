import type { ProviderRegistry } from "@carwatch/providers";
import { Worker, type Job } from "bullmq";
import { env } from "./env";
import type { RedisConnection } from "./redis";
import { processAlertJob } from "./jobs/send-alert";
import { processMatchJob } from "./jobs/match-listing";
import { processScrapeJob } from "./jobs/scrape-provider";
import { logger } from "./logger";
import { QUEUE_NAMES, type AlertJobData, type MatchJobData, type Queues, type ScrapeJobData } from "./queues";

export function startWorkers(connection: RedisConnection, queues: Queues, registry: ProviderRegistry) {
  const scrapeWorker = new Worker<ScrapeJobData>(
    QUEUE_NAMES.scrape,
    async (job: Job<ScrapeJobData>) => {
      await processScrapeJob(queues, registry, job.data);
    },
    { connection, concurrency: env.scrapeConcurrency },
  );

  const matchWorker = new Worker<MatchJobData>(
    QUEUE_NAMES.match,
    async (job: Job<MatchJobData>) => {
      await processMatchJob(queues, job.data);
    },
    { connection, concurrency: env.matchConcurrency },
  );

  const alertWorker = new Worker<AlertJobData>(
    QUEUE_NAMES.alert,
    async (job: Job<AlertJobData>) => {
      await processAlertJob(job.data);
    },
    { connection, concurrency: env.alertConcurrency },
  );

  const workers = [scrapeWorker, matchWorker, alertWorker];

  for (const worker of workers) {
    // A processor throwing only fails that job (BullMQ retries per job options);
    // this handler just logs so a bad job never takes down the process.
    worker.on("failed", (job, err) => {
      logger.error("Job failed", { queue: worker.name, jobId: job?.id, jobName: job?.name, error: err.message });
    });
    worker.on("error", (err) => {
      logger.error("Worker error", { queue: worker.name, error: err.message });
    });
  }

  return workers;
}
