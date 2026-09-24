import type { RateLimitConfig } from "@carwatch/shared";
import { DEFAULT_ACCEPT_LANGUAGE, DEFAULT_USER_AGENT } from "./browser-headers";
import { HttpError } from "./http-error";
import type { RateLimiter } from "./rate-limiter";
import { withRetry } from "./retry";

export { HttpError } from "./http-error";

export interface FetchTextOptions {
  headers?: Record<string, string>;
}

/**
 * Fetches a URL through the given rate limiter with a request timeout and
 * exponential backoff + jitter retries. Retries on network errors, timeouts,
 * and 429/5xx responses; does not retry on other 4xx (those are permanent).
 *
 * This is a plain HTTP request, not a real browser — it can't clear
 * fingerprint- or JS-challenge-based anti-bot protection. For a provider
 * that needs that, see `fetchTextViaBrowser` in ./browser-fetch instead.
 */
export async function fetchText(
  url: string,
  limiter: RateLimiter,
  config: RateLimitConfig,
  options: FetchTextOptions = {},
): Promise<string> {
  return withRetry(config, () =>
    limiter.schedule(async () => {
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
            "User-Agent": DEFAULT_USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": DEFAULT_ACCEPT_LANGUAGE,
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
    }),
  );
}
