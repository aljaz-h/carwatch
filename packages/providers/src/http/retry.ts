import type { RateLimitConfig } from "@carwatch/shared";
import { HttpError } from "./http-error";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shared exponential-backoff-with-jitter retry loop, used by every fetch
 * mechanism (plain HTTP, browser-based) so they behave identically from a
 * provider's point of view: same maxRetries, same backoff curve, same
 * permanent-vs-retryable classification (a non-429 4xx never retries; a
 * timeout, network error, 429, or 5xx does).
 */
export async function withRetry<T>(config: RateLimitConfig, attempt: () => Promise<T>): Promise<T> {
  let attemptNum = 0;
  let lastError: unknown;

  while (attemptNum <= config.maxRetries) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
      const isPermanent = err instanceof HttpError && err.status !== undefined && err.status < 500 && err.status !== 429;
      if (isPermanent || attemptNum === config.maxRetries) {
        throw err;
      }
      const backoff = config.retryBaseDelayMs * 2 ** attemptNum;
      const jitter = Math.floor(Math.random() * config.retryBaseDelayMs);
      await sleep(backoff + jitter);
      attemptNum += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
