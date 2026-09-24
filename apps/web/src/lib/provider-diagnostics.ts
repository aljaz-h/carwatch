import "server-only";
import { prisma, type Prisma, type ScrapeRunStatus as DbScrapeRunStatus } from "@carwatch/database";
import {
  deriveProviderHealthState,
  estimateExponentialBackoffDelayMs,
  manualScrapeJobId,
  parseProviderSchedulerId,
  PROVIDER_ERROR_TYPE_LABELS,
  type ProviderErrorType,
  type ProviderHealthState,
} from "@carwatch/shared";
import type { Job } from "bullmq";
import { queueClients } from "./queue-client";

const ACTIVE_JOB_STATES = ["waiting", "active", "delayed", "waiting-children"] as const;

/**
 * Estimated retry time for a delayed retry attempt. Deliberately computed
 * from BullMQ's own public, documented fields (`attemptsMade`, `finishedOn`)
 * and its published exponential-backoff formula, rather than reading the
 * "delayed" sorted set's score directly — that score is a version-specific
 * packed encoding (timestamp combined with a tie-break counter) meant for
 * internal ordering, not a timestamp on its own.
 */
function estimateRetryAt(job: Pick<Job, "attemptsMade" | "finishedOn" | "processedOn">): string | null {
  if (job.attemptsMade <= 0) return null;
  const anchor = job.finishedOn ?? job.processedOn ?? Date.now();
  const delayMs = estimateExponentialBackoffDelayMs(job.attemptsMade);
  return new Date(anchor + delayMs).toISOString();
}

export interface RunLogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface InFlightJobInfo {
  jobId: string;
  state: string;
  attemptsMade: number;
  attemptsMax: number;
  retryAt: string | null;
}

export interface RunSummary {
  id: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  listingsDiscovered: number;
  listingsNew: number;
  listingsUpdated: number;
  listingsUnchanged: number;
  listingsRemoved: number;
  errorsCount: number;
  isSuspicious: boolean;
  errorType: ProviderErrorType | null;
  errorTypeLabel: string | null;
  errorMessage: string | null;
  errorDetail: string | null;
  httpStatus: number | null;
  jobId: string | null;
  retryCount: number;
  /** Only populated by getProviderRunHistory — omitted from the frequently-polled diagnostics list to keep that payload small. */
  logs?: RunLogEntry[];
}

export interface ProviderDiagnostic {
  id: string;
  key: string;
  name: string;
  baseUrl: string | null;
  isEnabled: boolean;
  healthState: ProviderHealthState;
  scrapeIntervalMinutes: number;
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  nextRunAt: string | null;
  inFlight: InFlightJobInfo | null;
  latestRun: RunSummary | null;
  config: Prisma.JsonValue;
}

function toRunSummary(
  run: {
    id: string;
    status: string;
    trigger: string;
    startedAt: Date;
    finishedAt: Date | null;
    durationMs: number | null;
    listingsDiscovered: number;
    listingsNew: number;
    listingsUpdated: number;
    listingsUnchanged: number;
    listingsRemoved: number;
    errorsCount: number;
    isSuspicious: boolean;
    errorType: string | null;
    errorMessage: string | null;
    errorDetail: string | null;
    httpStatus: number | null;
    jobId: string | null;
    retryCount: number;
    logs?: Prisma.JsonValue;
  },
  options: { includeLogs?: boolean } = {},
): RunSummary {
  return {
    id: run.id,
    status: run.status,
    trigger: run.trigger,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    durationMs: run.durationMs,
    listingsDiscovered: run.listingsDiscovered,
    listingsNew: run.listingsNew,
    listingsUpdated: run.listingsUpdated,
    listingsUnchanged: run.listingsUnchanged,
    listingsRemoved: run.listingsRemoved,
    errorsCount: run.errorsCount,
    isSuspicious: run.isSuspicious,
    errorType: (run.errorType as ProviderErrorType | null) ?? null,
    errorTypeLabel: run.errorType ? (PROVIDER_ERROR_TYPE_LABELS[run.errorType as ProviderErrorType] ?? run.errorType) : null,
    errorMessage: run.errorMessage,
    errorDetail: run.errorDetail,
    httpStatus: run.httpStatus,
    jobId: run.jobId,
    retryCount: run.retryCount,
    logs: options.includeLogs ? ((run.logs as unknown as RunLogEntry[] | null) ?? []) : undefined,
  };
}

/**
 * A provider can briefly have more than one queued/delayed job at once — its
 * own failed job waiting to retry, *and* the scheduler's already-materialized
 * next routine occurrence sitting further out. When both exist, the retry is
 * what the admin actually wants to see ("Retrying in Xs, attempt N of M"),
 * so it's ranked above a plain future scheduled run.
 *
 * Rank 0 is deliberately treated as "not actually in flight" elsewhere: a
 * repeatable schedule always has a future occurrence sitting in the
 * "delayed" state, so counting every delayed job would make every scheduled
 * provider permanently appear to have a run in progress.
 */
function jobRelevanceRank(state: string, attemptsMade: number): number {
  if (state === "active") return 3;
  if (state === "delayed" && attemptsMade > 0) return 2; // an actual retry in progress
  if (state === "waiting" || state === "waiting-children") return 1;
  return 0; // a delayed job that's just the next routine scheduled tick
}

async function getInFlightJobsByProviderKey(): Promise<Map<string, InFlightJobInfo>> {
  const jobs = await queueClients.scrape.getJobs([...ACTIVE_JOB_STATES], 0, 100);
  const best = new Map<string, { rank: number; info: InFlightJobInfo }>();

  for (const job of jobs) {
    const providerKey = job.data?.providerKey;
    if (!providerKey) continue;

    const state = await job.getState();
    const rank = jobRelevanceRank(state, job.attemptsMade);
    if (best.has(providerKey) && best.get(providerKey)!.rank >= rank) continue;

    const retryAt = state === "delayed" ? estimateRetryAt(job) : null;
    best.set(providerKey, {
      rank,
      info: { jobId: job.id ?? "", state, attemptsMade: job.attemptsMade, attemptsMax: job.opts.attempts ?? 1, retryAt },
    });
  }

  return new Map([...best].map(([key, { info }]) => [key, info]));
}

async function getNextRunByProviderKey(): Promise<Map<string, string>> {
  const schedulers = await queueClients.scrape.getJobSchedulers();
  const result = new Map<string, string>();
  for (const s of schedulers) {
    const key = parseProviderSchedulerId(s.id);
    if (key && s.next) result.set(key, new Date(s.next).toISOString());
  }
  return result;
}

export async function getProviderDiagnostics(): Promise<ProviderDiagnostic[]> {
  const [providers, inFlightByKey, nextRunByKey] = await Promise.all([
    prisma.provider.findMany({
      orderBy: { name: "asc" },
      include: { scrapeRuns: { orderBy: { startedAt: "desc" }, take: 1 } },
    }),
    getInFlightJobsByProviderKey(),
    getNextRunByProviderKey(),
  ]);

  return providers.map((p) => {
    const latestRun = p.scrapeRuns[0] ?? null;
    const healthState = deriveProviderHealthState({
      isEnabled: p.isEnabled,
      hasEverRun: latestRun !== null,
      latestRunStatus: latestRun?.status,
      latestRunIsSuspicious: latestRun?.isSuspicious,
      consecutiveFailures: p.consecutiveFailures,
    });

    return {
      id: p.id,
      key: p.key,
      name: p.name,
      baseUrl: p.baseUrl,
      isEnabled: p.isEnabled,
      healthState,
      scrapeIntervalMinutes: p.scrapeIntervalMinutes,
      consecutiveFailures: p.consecutiveFailures,
      lastSuccessAt: p.lastSuccessAt?.toISOString() ?? null,
      lastAttemptAt: p.lastAttemptAt?.toISOString() ?? null,
      lastErrorAt: p.lastErrorAt?.toISOString() ?? null,
      lastError: p.lastError,
      nextRunAt: nextRunByKey.get(p.key) ?? null,
      inFlight: inFlightByKey.get(p.key) ?? null,
      latestRun: latestRun ? toRunSummary(latestRun) : null,
      config: p.config,
    };
  });
}

export async function getProviderRunHistory(
  providerKey: string,
  options: { status?: "all" | "success" | "failed" | "partial"; cursor?: string; limit?: number } = {},
): Promise<{ runs: RunSummary[]; nextCursor: string | null } | null> {
  const provider = await prisma.provider.findUnique({ where: { key: providerKey }, select: { id: true } });
  if (!provider) return null;

  const limit = Math.min(options.limit ?? 20, 50);
  const statusFilter: Record<string, DbScrapeRunStatus[]> = {
    success: ["SUCCESS"],
    failed: ["FAILED"],
    partial: ["PARTIAL"],
  };

  const runs = await prisma.providerScrapeRun.findMany({
    where: {
      providerId: provider.id,
      status: options.status && options.status !== "all" ? { in: statusFilter[options.status] } : undefined,
    },
    orderBy: { startedAt: "desc" },
    take: limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const hasMore = runs.length > limit;
  const page = hasMore ? runs.slice(0, limit) : runs;

  return {
    runs: page.map((r) => toRunSummary(r, { includeLogs: true })),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

export async function isProviderRunInFlight(providerKey: string): Promise<boolean> {
  const jobs = await queueClients.scrape.getJobs([...ACTIVE_JOB_STATES], 0, 100);
  for (const job of jobs) {
    if (job.data?.providerKey !== providerKey) continue;
    const state = await job.getState();
    if (jobRelevanceRank(state, job.attemptsMade) > 0) return true;
  }
  return false;
}

export async function enqueueManualProviderRun(providerKey: string): Promise<{ ok: boolean; jobId?: string; message?: string }> {
  const provider = await prisma.provider.findUnique({ where: { key: providerKey } });
  if (!provider) return { ok: false, message: "Unknown provider." };
  if (!provider.isEnabled) return { ok: false, message: "Enable this provider before running it manually." };

  if (await isProviderRunInFlight(providerKey)) {
    return { ok: false, message: "Provider scrape already in progress." };
  }

  const jobId = manualScrapeJobId(providerKey);
  await queueClients.scrape.add("scrape", { providerKey, trigger: "manual" }, { jobId });
  return { ok: true, jobId };
}

export async function getJobStatus(jobId: string): Promise<InFlightJobInfo | { state: "not_found" } > {
  const job = await queueClients.scrape.getJob(jobId);
  if (!job) return { state: "not_found" };

  const state = await job.getState();
  const retryAt = state === "delayed" ? estimateRetryAt(job) : null;

  return {
    jobId,
    state,
    attemptsMade: job.attemptsMade,
    attemptsMax: job.opts.attempts ?? 1,
    retryAt,
  };
}
