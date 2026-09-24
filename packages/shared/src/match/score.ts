import type { FilterCriteria } from "../filters/criteria";
import { formatMileage, formatPower, formatPrice } from "../utils/format";
import type { MatchCheck, MatchableListing, MatchResult } from "./types";

const REQUIRED_WEIGHT_WITH_PREFERRED = 60;
const REQUIRED_WEIGHT_ALONE = 100;

/** Builds the list of "required"/"preferred"-style checks for a criteria block. */
function buildChecks(criteria: FilterCriteria, listing: MatchableListing): MatchCheck[] {
  const checks: MatchCheck[] = [];
  const push = (key: string, label: string, passed: boolean) => checks.push({ key, label, passed });

  if (criteria.priceMax !== undefined || criteria.priceMin !== undefined) {
    const min = criteria.priceMin;
    const max = criteria.priceMax;
    const passed = (min === undefined || listing.price >= min) && (max === undefined || listing.price <= max);
    const label = max !== undefined ? `${formatPrice(listing.price)} (≤ ${formatPrice(max)})` : formatPrice(listing.price);
    push("price", label, passed);
  }

  if (criteria.yearMin !== undefined || criteria.yearMax !== undefined) {
    const { yearMin, yearMax } = criteria;
    const passed =
      listing.year !== undefined &&
      (yearMin === undefined || listing.year >= yearMin) &&
      (yearMax === undefined || listing.year <= yearMax);
    push("year", listing.year ? String(listing.year) : "Unknown year", passed);
  }

  if (criteria.mileageMin !== undefined || criteria.mileageMax !== undefined) {
    const { mileageMin, mileageMax } = criteria;
    const passed =
      listing.mileage !== undefined &&
      (mileageMin === undefined || listing.mileage >= mileageMin) &&
      (mileageMax === undefined || listing.mileage <= mileageMax);
    push("mileage", listing.mileage !== undefined ? formatMileage(listing.mileage) : "Unknown mileage", passed);
  }

  if (criteria.powerHpMin !== undefined || criteria.powerHpMax !== undefined) {
    const { powerHpMin, powerHpMax } = criteria;
    const passed =
      listing.powerHp !== undefined &&
      (powerHpMin === undefined || listing.powerHp >= powerHpMin) &&
      (powerHpMax === undefined || listing.powerHp <= powerHpMax);
    push("power", listing.powerHp !== undefined ? formatPower(listing.powerHp) : "Unknown power", passed);
  }

  if (criteria.engineCapacityMin !== undefined || criteria.engineCapacityMax !== undefined) {
    const { engineCapacityMin, engineCapacityMax } = criteria;
    const passed =
      listing.engineCapacity !== undefined &&
      (engineCapacityMin === undefined || listing.engineCapacity >= engineCapacityMin) &&
      (engineCapacityMax === undefined || listing.engineCapacity <= engineCapacityMax);
    push("engineCapacity", listing.engineCapacity ? `${listing.engineCapacity} cc` : "Unknown engine", passed);
  }

  if (criteria.manufacturers?.length) {
    push(
      "manufacturer",
      listing.manufacturer,
      criteria.manufacturers.some((m) => m.toLowerCase() === listing.manufacturer.toLowerCase()),
    );
  }

  if (criteria.models?.length) {
    push("model", listing.model, criteria.models.some((m) => m.toLowerCase() === listing.model.toLowerCase()));
  }

  if (criteria.fuelTypes?.length) {
    push("fuelType", listing.fuelType ?? "Unknown fuel", !!listing.fuelType && criteria.fuelTypes.includes(listing.fuelType));
  }

  if (criteria.transmissions?.length) {
    push(
      "transmission",
      listing.transmission ?? "Unknown transmission",
      !!listing.transmission && criteria.transmissions.includes(listing.transmission),
    );
  }

  if (criteria.drivetrains?.length) {
    push(
      "drivetrain",
      listing.drivetrain ?? "Unknown drivetrain",
      !!listing.drivetrain && criteria.drivetrains.includes(listing.drivetrain),
    );
  }

  if (criteria.bodyTypes?.length) {
    push("bodyType", listing.bodyType ?? "Unknown body", !!listing.bodyType && criteria.bodyTypes.includes(listing.bodyType));
  }

  if (criteria.locations?.length) {
    const loc = [listing.locationCountry, listing.locationRegion].filter(Boolean);
    push(
      "location",
      loc.join(", ") || "Unknown location",
      criteria.locations.some((l) => loc.some((x) => x?.toLowerCase() === l.toLowerCase())),
    );
  }

  if (criteria.providers?.length) {
    push("provider", listing.providerKey ?? "Unknown provider", !!listing.providerKey && criteria.providers.includes(listing.providerKey));
  }

  if (criteria.sellerTypes?.length) {
    push("sellerType", listing.sellerType ?? "Unknown seller", !!listing.sellerType && criteria.sellerTypes.includes(listing.sellerType));
  }

  if (criteria.features?.length) {
    for (const featureKey of criteria.features) {
      push(`feature:${featureKey}`, featureKey, listing.features.includes(featureKey));
    }
  }

  return checks;
}

/** Builds checks for the `excluded` block: `passed: true` means the disqualifying condition is present. */
function buildExclusionChecks(criteria: FilterCriteria, listing: MatchableListing): MatchCheck[] {
  const checks: MatchCheck[] = [];
  const push = (key: string, label: string, present: boolean) => checks.push({ key, label, passed: present });

  if (criteria.manufacturers?.length) {
    push("manufacturer", listing.manufacturer, criteria.manufacturers.some((m) => m.toLowerCase() === listing.manufacturer.toLowerCase()));
  }
  if (criteria.models?.length) {
    push("model", listing.model, criteria.models.some((m) => m.toLowerCase() === listing.model.toLowerCase()));
  }
  if (criteria.fuelTypes?.length) {
    push("fuelType", listing.fuelType ?? "", !!listing.fuelType && criteria.fuelTypes.includes(listing.fuelType));
  }
  if (criteria.transmissions?.length) {
    push("transmission", listing.transmission ?? "", !!listing.transmission && criteria.transmissions.includes(listing.transmission));
  }
  if (criteria.bodyTypes?.length) {
    push("bodyType", listing.bodyType ?? "", !!listing.bodyType && criteria.bodyTypes.includes(listing.bodyType));
  }
  if (criteria.sellerTypes?.length) {
    push("sellerType", listing.sellerType ?? "", !!listing.sellerType && criteria.sellerTypes.includes(listing.sellerType));
  }
  if (criteria.providers?.length) {
    push("provider", listing.providerKey ?? "", !!listing.providerKey && criteria.providers.includes(listing.providerKey));
  }
  if (criteria.damaged) {
    push("damaged", "Damaged", !!listing.damaged);
  }
  if (criteria.nonRunning) {
    push("nonRunning", "Non-running", !!listing.nonRunning);
  }
  if (criteria.partsCarOnly) {
    push("partsCarOnly", "Parts car", !!listing.partsCarOnly);
  }

  return checks;
}

/**
 * Deterministic, explainable match score for a saved search against a listing.
 *
 * - Any `excluded` condition present disqualifies the listing entirely (score 0).
 * - Every `required` condition must pass for the listing to count as a match.
 * - `preferred` conditions do not gate the match; each one met increases the score.
 */
export function scoreListing(
  listing: MatchableListing,
  criteria: { required: FilterCriteria; preferred: FilterCriteria; excluded: FilterCriteria },
): MatchResult {
  const excludedChecks = buildExclusionChecks(criteria.excluded, listing);
  const disqualified = excludedChecks.some((c) => c.passed);

  const requiredChecks = buildChecks(criteria.required, listing);
  const preferredChecks = buildChecks(criteria.preferred, listing);
  const requiredPassedAll = requiredChecks.every((c) => c.passed);

  const isMatch = !disqualified && requiredPassedAll;

  let score = 0;
  if (isMatch) {
    const requiredWeight = preferredChecks.length > 0 ? REQUIRED_WEIGHT_WITH_PREFERRED : REQUIRED_WEIGHT_ALONE;
    const preferredWeight = 100 - requiredWeight;
    const preferredRatio = preferredChecks.length > 0 ? preferredChecks.filter((c) => c.passed).length / preferredChecks.length : 0;
    score = Math.round(requiredWeight + preferredRatio * preferredWeight);
  }

  return { isMatch, disqualified, score, requiredChecks, preferredChecks, excludedChecks };
}
