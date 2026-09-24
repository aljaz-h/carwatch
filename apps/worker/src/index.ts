import { createDefaultRegistry } from "@carwatch/providers";
import { env } from "./env";
import { logger } from "./logger";
import { createQueues } from "./queues";
import { createRedisConnection } from "./redis";
import { reconcileProviderSchedules } from "./scheduler";
import { startWorkers } from "./workers";

async function main() {
  logger.info("CarWatch worker starting", { nodeEnv: env.nodeEnv });

  const connection = createRedisConnection();
  const queues = createQueues(connection);
  const registry = createDefaultRegistry();

  const workers = startWorkers(connection, queues, registry);

  await reconcileProviderSchedules(queues);
  const reconcileInterval = setInterval(
    () => {
      reconcileProviderSchedules(queues).catch((err) => logger.error("Schedule reconcile failed", { error: err.message }));
    },
    env.schedulerReconcileMinutes * 60_000,
  );

  logger.info("CarWatch worker ready", {
    providers: registry.list().map((p) => p.key),
    queues: ["scrape", "match", "alert"],
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Shutting down worker", { signal });
    clearInterval(reconcileInterval);
    await Promise.all(workers.map((w) => w.close()));
    await Promise.all(Object.values(queues).map((q) => q.close()));
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
