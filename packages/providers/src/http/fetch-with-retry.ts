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
              // A self-identifying bot User-Agent is an easy, free signal for
              // anti-bot filters to reject on sight. Sending headers that
              // resemble an ordinary browser request doesn't defeat
              // fingerprint- or IP-reputation-based blocking, but it does
              // rule out the cheapest, most common rejection reason.
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
              "Accept-Language": "sl-SI,sl;q=0.9,en-US;q=0.8,en;q=0.7",
              "Upgrade-Insecure-Requests": "1",
              "Sec-Fetch-Dest": "document",
              "Sec-Fetch-Mode": "navigate",
              "Sec-Fetch-Site": "none",
              "Sec-Fetch-User": "?1",
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
