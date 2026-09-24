import { describe, expect, it } from "vitest";
import { scoreListing } from "../match/score";
import type { MatchableListing } from "../match/types";

const baseListing: MatchableListing = {
  listingId: "l1",
  price: 11900,
  mileage: 121000,
  manufacturer: "Volkswagen",
  model: "Golf",
  year: 2018,
  powerHp: 150,
  fuelType: "PETROL",
  transmission: "MANUAL",
  features: ["led_headlights", "heated_seats"],
  locationCountry: "Slovenia",
  sellerType: "PRIVATE",
};

describe("scoreListing", () => {
  it("matches and scores highly when required pass and most preferred pass", () => {
    const result = scoreListing(baseListing, {
      required: { priceMax: 13000, yearMin: 2016, mileageMax: 150000, powerHpMin: 110 },
      preferred: { features: ["led_headlights", "heated_seats", "adaptive_cruise_control"] },
      excluded: {},
    });
    expect(result.isMatch).toBe(true);
    expect(result.disqualified).toBe(false);
    expect(result.requiredChecks.every((c) => c.passed)).toBe(true);
    // 2 of 3 preferred checks pass -> 60 + (2/3)*40 = 86.67 -> 87
    expect(result.score).toBe(87);
    const cruiseCheck = result.preferredChecks.find((c) => c.key === "feature:adaptive_cruise_control");
    expect(cruiseCheck?.passed).toBe(false);
  });

  it("fails to match when a required criterion is not met", () => {
    const result = scoreListing(baseListing, {
      required: { priceMax: 10000 },
      preferred: {},
      excluded: {},
    });
    expect(result.isMatch).toBe(false);
    expect(result.score).toBe(0);
  });

  it("disqualifies a listing matching an excluded condition regardless of required/preferred", () => {
    const result = scoreListing(baseListing, {
      required: { priceMax: 13000 },
      preferred: {},
      excluded: { fuelTypes: ["PETROL"] },
    });
    expect(result.disqualified).toBe(true);
    expect(result.isMatch).toBe(false);
    expect(result.score).toBe(0);
  });

  it("scores a match with no preferred criteria as 100", () => {
    const result = scoreListing(baseListing, {
      required: { priceMax: 13000 },
      preferred: {},
      excluded: {},
    });
    expect(result.isMatch).toBe(true);
    expect(result.score).toBe(100);
  });
});
