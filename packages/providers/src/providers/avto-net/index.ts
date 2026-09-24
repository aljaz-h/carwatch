import { DEFAULT_RATE_LIMIT, type NormalizedListing, type RateLimitConfig } from "@carwatch/shared";
import { ParserStructureError } from "../../errors";
import { fetchText } from "../../http/fetch-with-retry";
import { RateLimiter } from "../../http/rate-limiter";
import type { HealthCheckResult, Provider, RawListingPayload, SearchOptions, SearchResultItem } from "../../types";
import { normalizeAvtoNetListing } from "./map-normalize";
import { parseDetailPage, type AvtoNetRawDetail } from "./parse-detail";
import { hasExpectedSearchStructure, hasNextSearchPage, parseSearchPage } from "./parse-search";

const BASE_URL = "https://www.avto.net";
const SEARCH_PATH = "/Ads/results.asp";

export class AvtoNetProvider implements Provider {
  readonly key = "avto_net";
  readonly name = "Avto.net";
  readonly rateLimit: RateLimitConfig;
  private readonly limiter: RateLimiter;

  constructor(rateLimit: Partial<RateLimitConfig> = {}) {
    this.rateLimit = { ...DEFAULT_RATE_LIMIT, ...rateLimit };
    this.limiter = new RateLimiter(this.rateLimit);
  }

  async *searchListings(options: SearchOptions = {}): AsyncGenerator<SearchResultItem> {
    const maxPages = options.maxPages ?? 20;
    for (let page = 1; page <= maxPages; page += 1) {
      const url = `${BASE_URL}${SEARCH_PATH}?stran=${page}`;
      const html = await fetchText(url, this.limiter, this.rateLimit);

      if (page === 1 && !hasExpectedSearchStructure(html)) {
        throw new ParserStructureError(
          "Avto.net search results page did not contain the expected results container.",
          ".GO-Results",
          url,
        );
      }

      const items = parseSearchPage(html);
      for (const item of items) yield item;
      if (items.length === 0 || !hasNextSearchPage(html, page)) break;
    }
  }

  async getListing(providerListingId: string, hint?: { url?: string }): Promise<RawListingPayload<AvtoNetRawDetail>> {
    const url = hint?.url ?? `${BASE_URL}/Ads/details.asp?id=${providerListingId}`;
    const html = await fetchText(url, this.limiter, this.rateLimit);
    const data = parseDetailPage(html);
    return { providerListingId, url, fetchedAt: new Date().toISOString(), data };
  }

  normalizeListing(raw: RawListingPayload<AvtoNetRawDetail>): NormalizedListing {
    return normalizeAvtoNetListing(raw);
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      await fetchText(BASE_URL, this.limiter, { ...this.rateLimit, maxRetries: 0, timeoutMs: 8000 });
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - start };
    }
  }
}
