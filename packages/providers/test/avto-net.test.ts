import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { normalizeAvtoNetListing } from "../src/providers/avto-net/map-normalize.js";
import { parseDetailPage } from "../src/providers/avto-net/parse-detail.js";
import { hasExpectedSearchStructure, hasNextSearchPage, parseSearchPage } from "../src/providers/avto-net/parse-search.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures", "avto-net");

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf-8");
}

describe("avto.net parseSearchPage", () => {
  it("extracts all result rows with hints", () => {
    const html = loadFixture("search-page.html");
    const items = parseSearchPage(html);

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      providerListingId: "3381204",
      url: "https://www.avto.net/Ads/details.asp?id=3381204",
      hint: { title: "Volkswagen Golf 1.6 TDI Comfortline", price: 11900, year: 2017, mileage: 121000 },
    });
    expect(items[0]?.hint?.thumbnailUrl).toBe("https://img.avto.net/thumbs/3381204_1.jpg");
  });

  it("detects further pagination", () => {
    const html = loadFixture("search-page.html");
    expect(hasNextSearchPage(html, 1)).toBe(true);
    expect(hasNextSearchPage(html, 2)).toBe(false);
  });
});

describe("avto.net hasExpectedSearchStructure (parser-health guard)", () => {
  it("is true for a normal results page", () => {
    expect(hasExpectedSearchStructure(loadFixture("search-page.html"))).toBe(true);
  });

  it("is true for a page that legitimately matched zero listings (container present, empty)", () => {
    expect(hasExpectedSearchStructure(loadFixture("search-page-empty.html"))).toBe(true);
    expect(parseSearchPage(loadFixture("search-page-empty.html"))).toHaveLength(0);
  });

  it("is false when the results container is missing entirely (site markup changed)", () => {
    expect(hasExpectedSearchStructure(loadFixture("search-page-changed-markup.html"))).toBe(false);
  });
});

describe("avto.net parseDetailPage + normalizeAvtoNetListing", () => {
  it("parses the spec table, equipment, contact and gallery", () => {
    const html = loadFixture("listing-detail.html");
    const detail = parseDetailPage(html);

    expect(detail.title).toBe("Volkswagen Golf 1.6 TDI Comfortline");
    expect(detail.price).toBe(11900);
    expect(detail.priceOld).toBe(12500);
    expect(detail.specs["Znamka"]).toBe("Volkswagen");
    expect(detail.specs["Moč"]).toBe("85 kW (115 KM)");
    expect(detail.equipment).toContain("LED sprednji žarometi");
    expect(detail.contact.name).toBe("AC Motors d.o.o.");
    expect(detail.images).toHaveLength(3);
  });

  it("normalizes the raw payload into the common vehicle/listing shape", () => {
    const html = loadFixture("listing-detail.html");
    const data = parseDetailPage(html);
    const normalized = normalizeAvtoNetListing({
      providerListingId: "3381204",
      url: "https://www.avto.net/Ads/details.asp?id=3381204",
      fetchedAt: new Date().toISOString(),
      data,
    });

    expect(normalized.price).toBe(11900);
    expect(normalized.originalPrice).toBe(12500);
    expect(normalized.mileage).toBe(121000);
    expect(normalized.sellerType).toBe("DEALER");
    expect(normalized.locationCity).toBe("Ljubljana");
    expect(normalized.vehicle).toMatchObject({
      manufacturer: "Volkswagen",
      model: "Golf",
      generation: "Mk7 (facelift)",
      variant: "Comfortline",
      year: 2017,
      fuelType: "DIESEL",
      transmission: "MANUAL",
      engineCapacity: 1598,
      powerKw: 85,
      powerHp: 115,
      drivetrain: "FWD",
      bodyType: "HATCHBACK",
      doors: 5,
      seats: 5,
      exteriorColor: "Reflex Silver",
      vin: "WVWZZZAUZHW123456",
    });
    expect(normalized.vehicle.features).toEqual(
      expect.arrayContaining(["led_headlights", "parking_sensors_rear", "alloy_wheels", "apple_carplay", "android_auto", "keyless_entry"]),
    );
  });
});
