import "server-only";
import { Prisma } from "@carwatch/database";
import { prisma } from "./db";
import type { BrowseParams } from "./search-params";

const PAGE_SIZE = 24;

export const LISTING_INCLUDE = {
  vehicle: { include: { features: { include: { feature: true } } } },
  provider: true,
} satisfies Prisma.ListingInclude;

export type ListingWithRelations = Prisma.ListingGetPayload<{ include: typeof LISTING_INCLUDE }>;

function buildWhere(params: BrowseParams, options: { includeInactive?: boolean } = {}): Prisma.ListingWhereInput {
  const vehicle: Prisma.VehicleWhereInput = {};

  if (params.manufacturers.length) vehicle.manufacturer = { in: params.manufacturers, mode: "insensitive" };
  if (params.models.length) vehicle.model = { in: params.models, mode: "insensitive" };
  if (params.yearMin !== undefined || params.yearMax !== undefined) {
    vehicle.year = { gte: params.yearMin, lte: params.yearMax };
  }
  if (params.powerHpMin !== undefined || params.powerHpMax !== undefined) {
    vehicle.powerHp = { gte: params.powerHpMin, lte: params.powerHpMax };
  }
  if (params.fuelTypes.length) vehicle.fuelType = { in: params.fuelTypes as never[] };
  if (params.transmissions.length) vehicle.transmission = { in: params.transmissions as never[] };
  if (params.bodyTypes.length) vehicle.bodyType = { in: params.bodyTypes as never[] };
  if (params.drivetrains.length) vehicle.drivetrain = { in: params.drivetrains as never[] };

  const featureFilters: Prisma.ListingWhereInput[] = params.features.map((key) => ({
    vehicle: { features: { some: { feature: { key } } } },
  }));

  const where: Prisma.ListingWhereInput = {
    status: options.includeInactive ? undefined : "ACTIVE",
    vehicle: Object.keys(vehicle).length > 0 ? vehicle : undefined,
    price: params.priceMin !== undefined || params.priceMax !== undefined ? { gte: params.priceMin, lte: params.priceMax } : undefined,
    mileage: params.mileageMin !== undefined || params.mileageMax !== undefined ? { gte: params.mileageMin, lte: params.mileageMax } : undefined,
    providerId: params.providers.length ? { in: params.providers } : undefined,
    sellerType: params.sellerTypes.length ? { in: params.sellerTypes as never[] } : undefined,
    locationCountry: params.locations.length ? { in: params.locations } : undefined,
    AND: featureFilters.length ? featureFilters : undefined,
    OR: params.q
      ? [
          { title: { contains: params.q, mode: "insensitive" } },
          { vehicle: { manufacturer: { contains: params.q, mode: "insensitive" } } },
          { vehicle: { model: { contains: params.q, mode: "insensitive" } } },
        ]
      : undefined,
  };

  return where;
}

function buildOrderBy(params: BrowseParams): Prisma.ListingOrderByWithRelationInput[] {
  switch (params.sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "mileage_asc":
      return [{ mileage: "asc" }];
    case "year_desc":
      return [{ vehicle: { year: "desc" } }];
    case "recently_reduced":
      return [{ updatedAt: "desc" }];
    case "newest":
    case "best_match":
    default:
      return [{ firstSeenAt: "desc" }];
  }
}

export async function getBrowseListings(params: BrowseParams): Promise<{ listings: ListingWithRelations[]; total: number; pageCount: number }> {
  const where = buildWhere(params);
  const orderBy = buildOrderBy(params);

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: LISTING_INCLUDE,
      orderBy,
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getFilterFacets() {
  const [manufacturers, providers, locations] = await Promise.all([
    prisma.vehicle.findMany({
      where: { listing: { status: "ACTIVE" } },
      select: { manufacturer: true, model: true },
      distinct: ["manufacturer", "model"],
      orderBy: { manufacturer: "asc" },
    }),
    prisma.provider.findMany({ orderBy: { name: "asc" } }),
    prisma.listing.findMany({
      where: { status: "ACTIVE", locationCountry: { not: null } },
      select: { locationCountry: true },
      distinct: ["locationCountry"],
    }),
  ]);

  const manufacturerModels = new Map<string, Set<string>>();
  for (const v of manufacturers) {
    if (!manufacturerModels.has(v.manufacturer)) manufacturerModels.set(v.manufacturer, new Set());
    manufacturerModels.get(v.manufacturer)!.add(v.model);
  }

  return {
    manufacturers: [...manufacturerModels.entries()]
      .map(([manufacturer, models]) => ({ manufacturer, models: [...models].sort() }))
      .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer)),
    providers,
    locations: locations.map((l) => l.locationCountry!).sort(),
  };
}

export { PAGE_SIZE };
