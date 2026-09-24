import { z } from "zod";

/**
 * Flat filter criteria shared by the Browse search UI, the query builder, and
 * SavedSearch.required / .preferred / .excluded payloads. All fields optional;
 * an unset field means "no constraint" (required) or "no bonus" (preferred) or
 * "no exclusion" (excluded).
 */
export const filterCriteriaSchema = z.object({
  manufacturers: z.array(z.string()).optional(),
  models: z.array(z.string()).optional(),
  generations: z.array(z.string()).optional(),
  trims: z.array(z.string()).optional(),

  yearMin: z.number().int().optional(),
  yearMax: z.number().int().optional(),

  priceMin: z.number().int().optional(),
  priceMax: z.number().int().optional(),

  mileageMin: z.number().int().optional(),
  mileageMax: z.number().int().optional(),

  powerHpMin: z.number().int().optional(),
  powerHpMax: z.number().int().optional(),

  engineCapacityMin: z.number().int().optional(),
  engineCapacityMax: z.number().int().optional(),

  fuelTypes: z.array(z.string()).optional(),
  transmissions: z.array(z.string()).optional(),
  drivetrains: z.array(z.string()).optional(),
  bodyTypes: z.array(z.string()).optional(),

  locations: z.array(z.string()).optional(), // country or region names
  providers: z.array(z.string()).optional(), // provider keys
  sellerTypes: z.array(z.string()).optional(),

  features: z.array(z.string()).optional(), // feature keys, all required unless in `preferred`

  /** Free-text query across title/manufacturer/model/description. */
  query: z.string().optional(),

  /** Condition flags an excluded block can use to filter out bad listings. */
  damaged: z.boolean().optional(),
  nonRunning: z.boolean().optional(),
  partsCarOnly: z.boolean().optional(),
});

export type FilterCriteria = z.infer<typeof filterCriteriaSchema>;

export const SORT_OPTIONS = [
  "newest",
  "price_asc",
  "price_desc",
  "mileage_asc",
  "year_desc",
  "recently_reduced",
  "best_match",
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export function emptyFilterCriteria(): FilterCriteria {
  return {};
}

export function isFilterCriteriaEmpty(criteria: FilterCriteria): boolean {
  return Object.values(criteria).every(
    (v) => v === undefined || v === null || (Array.isArray(v) && v.length === 0) || v === "",
  );
}
