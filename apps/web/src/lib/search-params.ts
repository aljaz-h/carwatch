import type { SortOption } from "@carwatch/shared";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface BrowseParams {
  manufacturers: string[];
  models: string[];
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  powerHpMin?: number;
  powerHpMax?: number;
  fuelTypes: string[];
  transmissions: string[];
  bodyTypes: string[];
  drivetrains: string[];
  providers: string[];
  sellerTypes: string[];
  locations: string[];
  features: string[];
  q?: string;
  sort: SortOption;
  view: "grid" | "list";
  page: number;
}

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : v.split(",").filter(Boolean);
}

function toNumber(v: string | string[] | undefined): number | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function toStr(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s || undefined;
}

const VALID_SORTS: SortOption[] = ["newest", "price_asc", "price_desc", "mileage_asc", "year_desc", "recently_reduced", "best_match"];

export function parseBrowseParams(sp: RawSearchParams): BrowseParams {
  const sortRaw = toStr(sp.sort);
  const sort = (VALID_SORTS as string[]).includes(sortRaw ?? "") ? (sortRaw as SortOption) : "newest";
  const view = toStr(sp.view) === "list" ? "list" : "grid";
  const page = Math.max(1, toNumber(sp.page) ?? 1);

  return {
    manufacturers: toArray(sp.manufacturers),
    models: toArray(sp.models),
    yearMin: toNumber(sp.yearMin),
    yearMax: toNumber(sp.yearMax),
    priceMin: toNumber(sp.priceMin),
    priceMax: toNumber(sp.priceMax),
    mileageMin: toNumber(sp.mileageMin),
    mileageMax: toNumber(sp.mileageMax),
    powerHpMin: toNumber(sp.powerHpMin),
    powerHpMax: toNumber(sp.powerHpMax),
    fuelTypes: toArray(sp.fuelTypes),
    transmissions: toArray(sp.transmissions),
    bodyTypes: toArray(sp.bodyTypes),
    drivetrains: toArray(sp.drivetrains),
    providers: toArray(sp.providers),
    sellerTypes: toArray(sp.sellerTypes),
    locations: toArray(sp.locations),
    features: toArray(sp.features),
    q: toStr(sp.q),
    sort,
    view,
    page,
  };
}

export function isBrowseFiltered(params: BrowseParams): boolean {
  const { sort: _sort, view: _view, page: _page, ...rest } = params;
  return Object.values(rest).some((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== ""));
}
