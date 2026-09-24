import type { ProviderStatusValue } from "./enums";

export interface ProviderDiagnostics {
  key: string;
  status: ProviderStatusValue;
  isEnabled: boolean;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastError?: string;
  lastRun?: {
    startedAt: string;
    finishedAt?: string;
    durationMs?: number;
    listingsDiscovered: number;
    listingsNew: number;
    listingsUpdated: number;
    listingsUnchanged: number;
    listingsRemoved: number;
    errorsCount: number;
  };
}

export interface RateLimitConfig {
  /** Minimum delay between requests, in milliseconds. */
  minDelayMs: number;
  /** Maximum additional random jitter added to the delay, in milliseconds. */
  jitterMs: number;
  /** Maximum concurrent in-flight requests for this provider. */
  concurrency: number;
  /** Max retry attempts for a failing request. */
  maxRetries: number;
  /** Base delay for exponential backoff between retries, in milliseconds. */
  retryBaseDelayMs: number;
  /** Request timeout, in milliseconds. */
  timeoutMs: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  minDelayMs: 1500,
  jitterMs: 1500,
  concurrency: 2,
  maxRetries: 3,
  retryBaseDelayMs: 2000,
  timeoutMs: 15000,
};
