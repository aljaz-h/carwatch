import type { FilterCriteria } from "@carwatch/shared";
import { formatMileage, formatPrice } from "@carwatch/shared";
import { Badge } from "@/components/ui/badge";

export function criteriaToChips(criteria: FilterCriteria): string[] {
  const chips: string[] = [];
  if (criteria.models?.length) chips.push(criteria.models.join(" / "));
  else if (criteria.manufacturers?.length) chips.push(criteria.manufacturers.join(" / "));

  if (criteria.priceMin !== undefined || criteria.priceMax !== undefined) {
    chips.push(
      criteria.priceMin !== undefined && criteria.priceMax !== undefined
        ? `${formatPrice(criteria.priceMin)}–${formatPrice(criteria.priceMax)}`
        : criteria.priceMax !== undefined
          ? `≤ ${formatPrice(criteria.priceMax)}`
          : `≥ ${formatPrice(criteria.priceMin!)}`,
    );
  }
  if (criteria.yearMin !== undefined) chips.push(`${criteria.yearMin}+`);
  if (criteria.mileageMax !== undefined) chips.push(`under ${formatMileage(criteria.mileageMax)}`);
  if (criteria.powerHpMin !== undefined) chips.push(`${criteria.powerHpMin}+ hp`);
  if (criteria.fuelTypes?.length) chips.push(criteria.fuelTypes.map((f) => f.toLowerCase()).join(" or "));
  if (criteria.transmissions?.length) chips.push(criteria.transmissions.map((t) => t.toLowerCase().replace("_", "-")).join(" or "));
  if (criteria.locations?.length) chips.push(criteria.locations.join(" + "));

  return chips;
}

export function CriteriaSummary({ criteria }: { criteria: FilterCriteria }) {
  const chips = criteriaToChips(criteria);
  if (chips.length === 0) return <span className="text-xs text-fg-subtle">No filters set</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c, i) => (
        <Badge key={i} variant="outline">
          {c}
        </Badge>
      ))}
    </div>
  );
}
