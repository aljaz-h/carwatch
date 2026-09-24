import { prisma, type Listing } from "@carwatch/database";
import type { NormalizedListing } from "@carwatch/shared";

export interface UpsertResult {
  listing: Listing;
  isNew: boolean;
  changed: boolean;
  returned: boolean;
  priceChanged: { oldPrice: number; newPrice: number } | null;
  mileageChanged: { oldMileage: number; newMileage: number } | null;
}

const SIGNIFICANT_STATUSES = new Set(["INACTIVE", "EXPIRED", "REMOVED"]);

export async function upsertListing(normalized: NormalizedListing, providerId: string): Promise<UpsertResult> {
  const existing = await prisma.listing.findUnique({
    where: { providerId_providerListingId: { providerId, providerListingId: normalized.providerListingId } },
  });

  const now = new Date();

  if (!existing) {
    const listing = await prisma.listing.create({
      data: {
        provider: { connect: { id: providerId } },
        providerListingId: normalized.providerListingId,
        title: normalized.title,
        description: normalized.description,
        price: normalized.price,
        originalPrice: normalized.originalPrice ?? normalized.price,
        currency: normalized.currency,
        mileage: normalized.mileage,
        sellerName: normalized.sellerName,
        sellerType: normalized.sellerType,
        sellerPhone: normalized.sellerPhone,
        locationCity: normalized.locationCity,
        locationRegion: normalized.locationRegion,
        locationCountry: normalized.locationCountry,
        latitude: normalized.latitude,
        longitude: normalized.longitude,
        url: normalized.url,
        images: normalized.images,
        publishedAt: normalized.publishedAt ? new Date(normalized.publishedAt) : null,
        status: "ACTIVE",
        isAvailable: true,
        rawMetadata: (normalized.rawMetadata as never) ?? undefined,
        firstSeenAt: now,
        lastSeenAt: now,
        vehicle: {
          create: {
            manufacturer: normalized.vehicle.manufacturer,
            model: normalized.vehicle.model,
            generation: normalized.vehicle.generation,
            variant: normalized.vehicle.variant,
            year: normalized.vehicle.year,
            firstRegistration: normalized.vehicle.firstRegistration ? new Date(normalized.vehicle.firstRegistration) : null,
            fuelType: normalized.vehicle.fuelType,
            transmission: normalized.vehicle.transmission,
            engineCapacity: normalized.vehicle.engineCapacity,
            powerKw: normalized.vehicle.powerKw,
            powerHp: normalized.vehicle.powerHp,
            drivetrain: normalized.vehicle.drivetrain,
            bodyType: normalized.vehicle.bodyType,
            doors: normalized.vehicle.doors,
            seats: normalized.vehicle.seats,
            exteriorColor: normalized.vehicle.exteriorColor,
            vin: normalized.vehicle.vin,
            features: {
              create: normalized.vehicle.features.map((key) => ({
                feature: {
                  connectOrCreate: {
                    where: { key },
                    create: { key, label: key },
                  },
                },
              })),
            },
          },
        },
        priceHistory: { create: { price: normalized.price, recordedAt: now } },
        statusHistory: { create: { status: "ACTIVE", recordedAt: now } },
        mileageHistory: normalized.mileage !== undefined ? { create: { mileage: normalized.mileage, recordedAt: now } } : undefined,
      },
    });

    return { listing, isNew: true, changed: false, returned: false, priceChanged: null, mileageChanged: null };
  }

  const wasInactive = SIGNIFICANT_STATUSES.has(existing.status);
  const returned = wasInactive; // seen again in a fresh scrape -> it's back

  const priceChanged = existing.price !== normalized.price ? { oldPrice: existing.price, newPrice: normalized.price } : null;
  const mileageChanged =
    normalized.mileage !== undefined && existing.mileage !== null && existing.mileage !== normalized.mileage
      ? { oldMileage: existing.mileage, newMileage: normalized.mileage }
      : null;

  const changeLogs: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];
  if (existing.title !== normalized.title) changeLogs.push({ field: "title", oldValue: existing.title, newValue: normalized.title });
  if ((existing.description ?? "") !== (normalized.description ?? "")) {
    changeLogs.push({ field: "description", oldValue: existing.description, newValue: normalized.description ?? null });
  }

  const listing = await prisma.listing.update({
    where: { id: existing.id },
    data: {
      title: normalized.title,
      description: normalized.description,
      price: normalized.price,
      mileage: normalized.mileage ?? existing.mileage,
      sellerName: normalized.sellerName ?? existing.sellerName,
      sellerPhone: normalized.sellerPhone ?? existing.sellerPhone,
      images: normalized.images.length > 0 ? normalized.images : existing.images,
      status: "ACTIVE",
      isAvailable: true,
      lastSeenAt: now,
      priceHistory: priceChanged ? { create: { price: normalized.price, recordedAt: now } } : undefined,
      mileageHistory: mileageChanged ? { create: { mileage: normalized.mileage!, recordedAt: now } } : undefined,
      statusHistory: wasInactive ? { create: { status: "ACTIVE", recordedAt: now } } : undefined,
      changeLogs: changeLogs.length > 0 ? { create: changeLogs.map((c) => ({ ...c, recordedAt: now })) } : undefined,
    },
  });

  const changed = !!priceChanged || !!mileageChanged || returned || changeLogs.length > 0;

  return { listing, isNew: false, changed, returned, priceChanged, mileageChanged };
}

/**
 * After paging through all of a provider's current listings, anything ACTIVE
 * in our DB that was not seen in this run is presumed gone and marked
 * INACTIVE (never deleted, so it can be detected as "returned" later).
 */
export async function sweepMissingListings(providerId: string, seenProviderListingIds: Set<string>): Promise<Listing[]> {
  const activeListings: Array<{ id: string; providerListingId: string }> = await prisma.listing.findMany({
    where: { providerId, status: "ACTIVE" },
    select: { id: true, providerListingId: true },
  });

  const missing = activeListings.filter((l) => !seenProviderListingIds.has(l.providerListingId));
  if (missing.length === 0) return [];

  const now = new Date();
  const updated: Listing[] = [];
  for (const m of missing) {
    const listing = await prisma.listing.update({
      where: { id: m.id },
      data: {
        status: "INACTIVE",
        isAvailable: false,
        statusHistory: { create: { status: "INACTIVE", recordedAt: now } },
      },
    });
    updated.push(listing);
  }
  return updated;
}
