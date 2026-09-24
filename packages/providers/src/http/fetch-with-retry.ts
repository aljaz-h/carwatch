import type { RateLimitConfig } from "@carwatch/shared";
import type { RateLimiter } from "./rate-limiter";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchTextOptions {
  headers?: Record<string, string>;
}

/**
 * Fetches a URL through the given rate limiter with a request timeout and
 * exponential backoff + jitter retries. Retries on network errors, timeouts,
 * and 429/5xx responses; does not retry on other 4xx (those are permanent).
 */
export async function fetchText(
  url: string,
  limiter: RateLimiter,
  config: RateLimitConfig,
  options: FetchTextOptions = {},
): Promise<string> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= config.maxRetries) {
    try {
      return await limiter.schedule(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              "User-Agent": "CarWatchBot/0.1 (+https://github.com/carwatch; self-hosted listing monitor)",
              Accept: "text/html,application/xhtml+xml",
              ...options.headers,
            },
          });
          if (!response.ok) {
            if (response.status === 429 || response.status >= 500) {
              throw new HttpError(`Retryable HTTP ${response.status} for ${url}`, response.status);
            }
            throw new HttpError(`Non-retryable HTTP ${response.status} for ${url}`, response.status);
          }
          return await response.text();
        } finally {
          clearTimeout(timeout);
        }
      });
    } catch (err) {
      lastError = err;
      const isPermanent = err instanceof HttpError && err.status !== undefined && err.status < 500 && err.status !== 429;
      if (isPermanent || attempt === config.maxRetries) {
        throw err;
      }
      const backoff = config.retryBaseDelayMs * 2 ** attempt;
      const jitter = Math.floor(Math.random() * config.retryBaseDelayMs);
      await sleep(backoff + jitter);
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
