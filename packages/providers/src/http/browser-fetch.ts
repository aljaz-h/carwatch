import type { RateLimitConfig } from "@carwatch/shared";
import { chromium, type Browser } from "playwright";
import { DEFAULT_ACCEPT_LANGUAGE, DEFAULT_LOCALE, DEFAULT_USER_AGENT } from "./browser-headers";
import { HttpError } from "./http-error";
import type { RateLimiter } from "./rate-limiter";
import { withRetry } from "./retry";

// Browser navigation is inherently slower than a plain HTTP GET (loading and
// running JS, waiting for a possible anti-bot challenge to resolve). Use
// whichever is larger: the provider's configured timeout, or this floor.
const MIN_TIMEOUT_MS = 30_000;

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  browserPromise ??= chromium.launch({ headless: true });
  return browserPromise;
}

/**
 * Fetches a URL's rendered HTML using a real headless Chromium instance
 * instead of a plain HTTP request — same signature/contract as `fetchText`
 * (same rate limiter, same retry/backoff config, same HttpError shape), so a
 * provider can switch between the two without changing anything else.
 *
 * This gets a real browser TLS/JS fingerprint and can clear an anti-bot
 * challenge page that a plain HTTP request can't, at the cost of being far
 * slower and heavier per request. Use it only for a provider that's
 * confirmed to need it (a plain `fetchText` with realistic headers still
 * getting blocked) — not as the default.
 */
export async function fetchTextViaBrowser(url: string, limiter: RateLimiter, config: RateLimitConfig): Promise<string> {
  return withRetry(config, () =>
    limiter.schedule(async () => {
      const browser = await getBrowser();
      const context = await browser.newContext({
        userAgent: DEFAULT_USER_AGENT,
        locale: DEFAULT_LOCALE,
        viewport: { width: 1366, height: 768 },
        extraHTTPHeaders: { "Accept-Language": DEFAULT_ACCEPT_LANGUAGE },
      });
      try {
        const page = await context.newPage();
        // "networkidle" (not "domcontentloaded") so a JS-based anti-bot
        // interstitial has time to resolve and redirect before we read the
        // page content — otherwise we'd capture the challenge page itself.
        const response = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: Math.max(config.timeoutMs, MIN_TIMEOUT_MS),
        });
        const status = response?.status();
        if (status !== undefined && status >= 400) {
          if (status === 429 || status >= 500) {
            throw new HttpError(`Retryable HTTP ${status} for ${url}`, status);
          }
          throw new HttpError(`Non-retryable HTTP ${status} for ${url}`, status);
        }
        return await page.content();
      } finally {
        await context.close();
      }
    }),
  );
}

/**
 * Closes the shared Chromium process. Call once, on worker shutdown — not
 * after every scrape, since relaunching a browser per request is what this
 * module exists to avoid.
 */
export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return;
  const browser = await browserPromise;
  browserPromise = null;
  await browser.close();
}
