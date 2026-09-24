function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  nodeEnv: process.env.NODE_ENV ?? "development",
  scrapeConcurrency: Number.parseInt(process.env.SCRAPE_CONCURRENCY ?? "2", 10),
  matchConcurrency: Number.parseInt(process.env.MATCH_CONCURRENCY ?? "5", 10),
  alertConcurrency: Number.parseInt(process.env.ALERT_CONCURRENCY ?? "5", 10),
  schedulerReconcileMinutes: Number.parseInt(process.env.SCHEDULER_RECONCILE_MINUTES ?? "5", 10),
  webBaseUrl: process.env.WEB_BASE_URL ?? "http://localhost:3000",
  providerRunRetentionDays: Number.parseInt(process.env.PROVIDER_RUN_RETENTION_DAYS ?? "30", 10),
};
