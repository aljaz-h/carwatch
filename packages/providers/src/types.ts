import type { NormalizedListing, RateLimitConfig } from "@carwatch/shared";

/** Lightweight result yielded while paging through a provider's search/listing pages. */
export interface SearchResultItem {
  providerListingId: string;
  url: string;
  /** Fields cheaply available on the search results page, used to skip unnecessary detail fetches. */
  hint?: {
    title?: string;
    price?: number;
    mileage?: number;
    year?: number;
    thumbnailUrl?: string;
  };
}

export interface SearchOptions {
  /** Stop after this many result pages (safety bound / testing). */
  maxPages?: number;
  /** Provider-specific search query overrides (make/model, region, etc). Optional — most providers crawl broadly. */
  query?: Record<string, string | number | undefined>;
}

/** Raw payload captured from a provider, opaque to the rest of the app until normalized. */
export interface RawListingPayload<T = unknown> {
  providerListingId: string;
  url: string;
  fetchedAt: string;
  data: T;
}

export interface HealthCheckResult {
  ok: boolean;
  message?: string;
  latencyMs?: number;
}

/**
 * Common contract every marketplace integration implements. The rest of the
 * application (worker jobs, diagnostics UI) only ever depends on this
 * interface — never on a specific marketplace's scraping details.
 */
export interface Provider {
  readonly key: string;
  readonly name: string;
  readonly rateLimit: RateLimitConfig;

  /** Pages through the provider's listings, yielding lightweight search results. */
  searchListings(options?: SearchOptions): AsyncGenerator<SearchResultItem>;

  /** Fetches the full detail payload for one listing. */
  getListing(providerListingId: string, hint?: { url?: string }): Promise<RawListingPayload>;

  /** Converts a raw payload into CarWatch's common vehicle/listing shape. Pure function, no I/O. */
  normalizeListing(raw: RawListingPayload): NormalizedListing;

  /** Cheap connectivity/markup check used by the settings UI and before a scrape run. */
  healthCheck(): Promise<HealthCheckResult>;
}
