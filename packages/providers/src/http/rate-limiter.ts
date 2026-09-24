import type { RateLimitConfig } from "@carwatch/shared";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Per-provider request scheduler: caps concurrency and enforces a minimum
 * delay (plus randomized jitter) between requests, so scraping stays polite
 * and does not hammer a marketplace with bursts of parallel requests.
 */
export class RateLimiter {
  private active = 0;
  private queue: Array<() => void> = [];
  private lastRequestAt = 0;

  constructor(private readonly config: RateLimitConfig) {}

  async schedule<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      await this.waitForSlot();
      return await task();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.config.concurrency) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  private release(): void {
    this.active -= 1;
    const next = this.queue.shift();
    if (next) next();
  }

  private async waitForSlot(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    const jitter = Math.floor(Math.random() * this.config.jitterMs);
    const requiredDelay = this.config.minDelayMs + jitter;
    if (elapsed < requiredDelay) {
      await sleep(requiredDelay - elapsed);
    }
    this.lastRequestAt = Date.now();
  }
}
