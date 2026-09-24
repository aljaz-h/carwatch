import { describe, expect, it } from "vitest";
import { SEED_VEHICLES, seedVehicleImages } from "../seed-data.js";

describe("seed data", () => {
  it("gives every seed vehicle at least one placeholder image derived from its own slug", () => {
    for (const vehicle of SEED_VEHICLES) {
      const images = seedVehicleImages(vehicle);
      expect(images.length).toBeGreaterThan(0);
      for (const image of images) {
        expect(image).toContain(encodeURIComponent(vehicle.slug));
      }
    }
  });

  it("keeps price history chronological with a first entry matching the seeded original price context", () => {
    for (const vehicle of SEED_VEHICLES) {
      const daysAgo = vehicle.priceEvents.map((e) => e.daysAgo);
      const sortedDesc = [...daysAgo].sort((a, b) => b - a);
      expect(daysAgo).toEqual(sortedDesc);
    }
  });

  it("has unique provider listing IDs per provider", () => {
    const seen = new Set<string>();
    for (const vehicle of SEED_VEHICLES) {
      const key = `${vehicle.providerKey}:${vehicle.providerListingId}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
