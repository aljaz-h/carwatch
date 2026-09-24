import { closeBrowser, createDefaultRegistry } from "@carwatch/providers";
import { cleanupOldProviderRuns } from "./jobs/cleanup-provider-runs";
import { env } from "./env";
import { startHeartbeat } from "./heartbeat";
import { logger } from "./logger";
import { createQueues } from "./queues";
import { createRedisConnection } from "./redis";
import { reconcileProviderSchedules } from "./scheduler";
import { startWorkers } from "./workers";

const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

async function main() {
  logger.info("CarWatch worker starting", { nodeEnv: env.nodeEnv, version: env.version, gitSha: env.gitSha });

  const connection = createRedisConnection();
  const queues = createQueues(connection);
  const registry = createDefaultRegistry();

  const workers = startWorkers(connection, queues, registry);
  const heartbeatInterval = startHeartbeat();

  await reconcileProviderSchedules(queues);
  const reconcileInterval = setInterval(
    () => {
      reconcileProviderSchedules(queues).catch((err) => logger.error("Schedule reconcile failed", { error: err.message }));
    },
    env.schedulerReconcileMinutes * 60_000,
  );

  cleanupOldProviderRuns().catch((err) => logger.error("Provider run cleanup failed", { error: err.message }));
  const cleanupInterval = setInterval(() => {
    cleanupOldProviderRuns().catch((err) => logger.error("Provider run cleanup failed", { error: err.message }));
  }, CLEANUP_INTERVAL_MS);

  logger.info("CarWatch worker ready", {
    providers: registry.list().map((p) => p.key),
    queues: ["scrape", "match", "alert"],
    providerRunRetentionDays: env.providerRunRetentionDays,
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Shutting down worker", { signal });
    clearInterval(reconcileInterval);
    clearInterval(cleanupInterval);
    clearInterval(heartbeatInterval);
    await Promise.all(workers.map((w) => w.close()));
    await Promise.all(Object.values(queues).map((q) => q.close()));
    await closeBrowser();
    connection.disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  // Defensive top-level handlers so an unexpected rejection anywhere never
  // silently kills the whole worker process without a log line.
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", { error: reason instanceof Error ? reason.message : String(reason) });
  });
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", { error: err.message });
  });
}

main().catch((err) => {
  logger.error("Worker failed to start", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
