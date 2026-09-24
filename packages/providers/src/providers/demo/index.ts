import { buildPlaceholderImageUri, colorNameToHex, DEFAULT_RATE_LIMIT, type NormalizedListing, type RateLimitConfig } from "@carwatch/shared";
import type { HealthCheckResult, Provider, RawListingPayload, SearchOptions, SearchResultItem } from "../../types";
import { DEMO_TEMPLATES, type DemoTemplate } from "./data";

/**
 * In-memory provider with no network access, used as a safe default in
 * development and in the Docker Compose demo profile so the full
 * scrape -> normalize -> match -> alert pipeline can be exercised without
 * making requests to any real marketplace.
 *
 * Prices/mileage drift slightly with each call (seeded by day) so the worker
 * has something realistic to detect: gradual price drops, occasional
 * "new" listings.
 */
export class DemoProvider implements Provider {
  readonly key = "demo";
  readonly name = "Demo Marketplace";
  readonly rateLimit: RateLimitConfig;

  constructor(rateLimit: Partial<RateLimitConfig> = {}) {
    this.rateLimit = { ...DEFAULT_RATE_LIMIT, minDelayMs: 50, jitterMs: 50, ...rateLimit };
  }

  private dayIndex(): number {
    return Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  }

  private priceForToday(template: DemoTemplate): number {
    const daysSinceEpochOffset = this.dayIndex() % 30;
    // Gentle downward drift over a rolling 30-day cycle, in €100 steps, floor at -1200.
    const drift = Math.min(daysSinceEpochOffset * 40, 1200);
    return template.basePrice - drift;
  }

  async *searchListings(options: SearchOptions = {}): AsyncGenerator<SearchResultItem> {
    const maxPages = options.maxPages ?? 1;
    if (maxPages < 1) return;
    for (const template of DEMO_TEMPLATES) {
      yield {
        providerListingId: template.id,
        url: `https://demo.invalid/listing/${template.id}`,
        hint: {
          title: `${template.manufacturer} ${template.model} ${template.variant}`,
          price: this.priceForToday(template),
          year: template.year,
          mileage: template.baseMileage,
        },
      };
    }
  }

  async getListing(providerListingId: string): Promise<RawListingPayload<DemoTemplate>> {
    const template = DEMO_TEMPLATES.find((t) => t.id === providerListingId);
    if (!template) throw new Error(`Unknown demo listing ${providerListingId}`);
    return {
      providerListingId,
      url: `https://demo.invalid/listing/${template.id}`,
      fetchedAt: new Date().toISOString(),
      data: template,
    };
  }

  normalizeListing(raw: RawListingPayload<DemoTemplate>): NormalizedListing {
    const t = raw.data;
    const colorHex = colorNameToHex(t.color);
    const images = (["side", "front", "rear", "interior"] as const).map((shot) =>
      buildPlaceholderImageUri({ shot, colorHex, seed: t.id }),
    );
    return {
      providerListingId: t.id,
      title: `${t.manufacturer} ${t.model} ${t.variant}`,
      description: `${t.manufacturer} ${t.model}, ${t.year}, ${t.baseMileage.toLocaleString("de-DE")} km. Demo listing for local development.`,
      price: this.priceForToday(t),
      originalPrice: t.basePrice,
      currency: "EUR",
      mileage: t.baseMileage,
      sellerType: "DEALER",
      sellerName: "Demo Motors",
      locationCity: t.city,
      locationCountry: t.country,
      url: raw.url,
      images,
      status: "ACTIVE",
      vehicle: {
        manufacturer: t.manufacturer,
        model: t.model,
        generation: t.generation,
        variant: t.variant,
        year: t.year,
        fuelType: t.fuelType,
        transmission: t.transmission,
        engineCapacity: t.engineCapacity,
        powerKw: t.powerKw,
        powerHp: t.powerHp,
        drivetrain: t.drivetrain,
        bodyType: t.bodyType,
        exteriorColor: t.color,
        features: t.features,
      },
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return { ok: true, latencyMs: 1 };
  }
}
