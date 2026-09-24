import { describe, expect, it } from "vitest";
import { toMatchable } from "../src/matching/to-matchable.js";

describe("toMatchable", () => {
  it("maps a Prisma listing+vehicle into the shared MatchableListing shape", () => {
    const listing = {
      id: "l1",
      price: 11900,
      mileage: 121000,
      locationCountry: "Slovenia",
      locationRegion: "Osrednjeslovenska",
      sellerType: "DEALER",
    } as never;

    const vehicle = {
      manufacturer: "Volkswagen",
      model: "Golf",
      generation: "Mk7",
      variant: "Comfortline",
      year: 2017,
      powerHp: 115,
      engineCapacity: 1598,
      fuelType: "DIESEL",
      transmission: "MANUAL",
      drivetrain: "FWD",
      bodyType: "HATCHBACK",
      features: [{ feature: { key: "led_headlights" } }, { feature: { key: "alloy_wheels" } }],
    } as never;

    const result = toMatchable(listing, vehicle, "avto_net");

    expect(result).toMatchObject({
      listingId: "l1",
      price: 11900,
      mileage: 121000,
      manufacturer: "Volkswagen",
      model: "Golf",
      powerHp: 115,
      fuelType: "DIESEL",
      providerKey: "avto_net",
      sellerType: "DEALER",
    });
    expect(result.features).toEqual(["led_headlights", "alloy_wheels"]);
  });
});
