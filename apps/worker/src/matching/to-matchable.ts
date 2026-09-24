import type { Listing, Vehicle, VehicleFeature } from "@carwatch/database";
import type { MatchableListing } from "@carwatch/shared";

type VehicleWithFeatures = Vehicle & { features: (VehicleFeature & { feature: { key: string } })[] };

export function toMatchable(listing: Listing, vehicle: VehicleWithFeatures, providerKey: string): MatchableListing {
  return {
    listingId: listing.id,
    price: listing.price,
    mileage: listing.mileage ?? undefined,
    manufacturer: vehicle.manufacturer,
    model: vehicle.model,
    generation: vehicle.generation ?? undefined,
    variant: vehicle.variant ?? undefined,
    year: vehicle.year ?? undefined,
    powerHp: vehicle.powerHp ?? undefined,
    engineCapacity: vehicle.engineCapacity ?? undefined,
    fuelType: vehicle.fuelType ?? undefined,
    transmission: vehicle.transmission ?? undefined,
    drivetrain: vehicle.drivetrain ?? undefined,
    bodyType: vehicle.bodyType ?? undefined,
    features: vehicle.features.map((f: { feature: { key: string } }) => f.feature.key),
    locationCountry: listing.locationCountry ?? undefined,
    locationRegion: listing.locationRegion ?? undefined,
    providerKey,
    sellerType: listing.sellerType,
  };
}
