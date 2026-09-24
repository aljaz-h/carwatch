import type { FilterCriteria } from "@carwatch/shared";
import type { BrowseParams } from "./search-params";

/** Converts the current Browse filter state into a FilterCriteria payload, e.g. to seed a new saved search. */
export function browseParamsToCriteria(params: BrowseParams): FilterCriteria {
  const criteria: FilterCriteria = {};
  if (params.manufacturers.length) criteria.manufacturers = params.manufacturers;
  if (params.models.length) criteria.models = params.models;
  if (params.yearMin !== undefined) criteria.yearMin = params.yearMin;
  if (params.yearMax !== undefined) criteria.yearMax = params.yearMax;
  if (params.priceMin !== undefined) criteria.priceMin = params.priceMin;
  if (params.priceMax !== undefined) criteria.priceMax = params.priceMax;
  if (params.mileageMin !== undefined) criteria.mileageMin = params.mileageMin;
  if (params.mileageMax !== undefined) criteria.mileageMax = params.mileageMax;
  if (params.powerHpMin !== undefined) criteria.powerHpMin = params.powerHpMin;
  if (params.powerHpMax !== undefined) criteria.powerHpMax = params.powerHpMax;
  if (params.fuelTypes.length) criteria.fuelTypes = params.fuelTypes;
  if (params.transmissions.length) criteria.transmissions = params.transmissions;
  if (params.bodyTypes.length) criteria.bodyTypes = params.bodyTypes;
  if (params.drivetrains.length) criteria.drivetrains = params.drivetrains;
  if (params.providers.length) criteria.providers = params.providers;
  if (params.sellerTypes.length) criteria.sellerTypes = params.sellerTypes;
  if (params.locations.length) criteria.locations = params.locations;
  if (params.q) criteria.query = params.q;
  return criteria;
}

export function suggestSavedSearchName(criteria: FilterCriteria): string {
  const parts: string[] = [];
  if (criteria.models?.length) parts.push(criteria.models.join(" / "));
  else if (criteria.manufacturers?.length) parts.push(criteria.manufacturers.join(" / "));
  if (criteria.priceMax) parts.push(`under €${criteria.priceMax.toLocaleString("de-DE")}`);
  return parts.length > 0 ? parts.join(" ") : "New saved search";
}
