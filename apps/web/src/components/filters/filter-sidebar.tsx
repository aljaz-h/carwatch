"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FilterSection } from "./filter-section";

export interface FacetData {
  manufacturers: { manufacturer: string; models: string[] }[];
  providers: { id: string; key: string; name: string }[];
  locations: string[];
}

const FUEL_TYPES = [
  ["PETROL", "Petrol"],
  ["DIESEL", "Diesel"],
  ["ELECTRIC", "Electric"],
  ["HYBRID", "Hybrid"],
  ["PLUGIN_HYBRID", "Plug-in hybrid"],
  ["LPG", "LPG"],
] as const;

const TRANSMISSIONS = [
  ["MANUAL", "Manual"],
  ["AUTOMATIC", "Automatic"],
  ["SEMI_AUTOMATIC", "Semi-automatic"],
] as const;

const BODY_TYPES = [
  ["HATCHBACK", "Hatchback"],
  ["SEDAN", "Sedan"],
  ["WAGON", "Wagon"],
  ["SUV", "SUV"],
  ["COUPE", "Coupe"],
  ["CONVERTIBLE", "Convertible"],
  ["VAN", "Van"],
] as const;

const DRIVETRAINS = [
  ["FWD", "Front-wheel"],
  ["RWD", "Rear-wheel"],
  ["AWD", "All-wheel"],
] as const;

const SELLER_TYPES = [
  ["DEALER", "Dealer"],
  ["PRIVATE", "Private"],
] as const;

function useFilterUpdater() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page");
      startTransition(() => {
        router.push(`/browse?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  return { searchParams, update };
}

function toggleInList(params: URLSearchParams, key: string, value: string) {
  const current = params.get(key)?.split(",").filter(Boolean) ?? [];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  if (next.length > 0) params.set(key, next.join(","));
  else params.delete(key);
}

function CheckboxRow({ checked, onCheckedChange, children }: { checked: boolean; onCheckedChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-fg-muted hover:text-fg">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      {children}
    </label>
  );
}

export function FilterSidebar({ facets, className }: { facets: FacetData; className?: string }) {
  const { searchParams, update } = useFilterUpdater();
  const [expandedMakes, setExpandedMakes] = useState<Set<string>>(new Set());

  const getList = (key: string) => searchParams.get(key)?.split(",").filter(Boolean) ?? [];
  const manufacturers = getList("manufacturers");
  const models = getList("models");

  const numberField = (key: string) => searchParams.get(key) ?? "";

  const setRange = (minKey: string, maxKey: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    update((params) => {
      const key = e.target.dataset.rangeKey === "min" ? minKey : maxKey;
      if (value) params.set(key, value);
      else params.delete(key);
    });
  };

  const clearAll = () => {
    update((params) => {
      for (const key of [...params.keys()]) {
        if (key !== "sort" && key !== "view") params.delete(key);
      }
    });
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Filters</h2>
        <button onClick={clearAll} className="text-xs font-medium text-accent hover:underline">
          Clear all
        </button>
      </div>

      <FilterSection title="Make & Model">
        <div className="max-h-64 overflow-y-auto pr-1">
          {facets.manufacturers.map(({ manufacturer, models: modelList }) => {
            const isChecked = manufacturers.includes(manufacturer);
            const isExpanded = expandedMakes.has(manufacturer) || modelList.some((m) => models.includes(m));
            return (
              <div key={manufacturer}>
                <div className="flex items-center gap-1">
                  <CheckboxRow
                    checked={isChecked}
                    onCheckedChange={() => update((params) => toggleInList(params, "manufacturers", manufacturer))}
                  >
                    {manufacturer}
                  </CheckboxRow>
                  {modelList.length > 1 && (
                    <button
                      className="ml-auto text-fg-subtle hover:text-fg"
                      onClick={() =>
                        setExpandedMakes((prev) => {
                          const next = new Set(prev);
                          if (next.has(manufacturer)) next.delete(manufacturer);
                          else next.add(manufacturer);
                          return next;
                        })
                      }
                    >
                      <span className="text-xs">{isExpanded ? "–" : "+"}</span>
                    </button>
                  )}
                </div>
                {isExpanded && (
                  <div className="ml-5 flex flex-col">
                    {modelList.map((model) => (
                      <CheckboxRow key={model} checked={models.includes(model)} onCheckedChange={() => update((params) => toggleInList(params, "models", model))}>
                        {model}
                      </CheckboxRow>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Price">
        <div className="flex items-center gap-2">
          <RangeInput placeholder="Min €" rangeKey="min" defaultValue={numberField("priceMin")} onBlur={setRange("priceMin", "priceMax")} />
          <span className="text-fg-subtle">–</span>
          <RangeInput placeholder="Max €" rangeKey="max" defaultValue={numberField("priceMax")} onBlur={setRange("priceMin", "priceMax")} />
        </div>
      </FilterSection>

      <FilterSection title="Year">
        <div className="flex items-center gap-2">
          <RangeInput placeholder="From" rangeKey="min" defaultValue={numberField("yearMin")} onBlur={setRange("yearMin", "yearMax")} />
          <span className="text-fg-subtle">–</span>
          <RangeInput placeholder="To" rangeKey="max" defaultValue={numberField("yearMax")} onBlur={setRange("yearMin", "yearMax")} />
        </div>
      </FilterSection>

      <FilterSection title="Mileage">
        <div className="flex items-center gap-2">
          <RangeInput placeholder="Min km" rangeKey="min" defaultValue={numberField("mileageMin")} onBlur={setRange("mileageMin", "mileageMax")} />
          <span className="text-fg-subtle">–</span>
          <RangeInput placeholder="Max km" rangeKey="max" defaultValue={numberField("mileageMax")} onBlur={setRange("mileageMin", "mileageMax")} />
        </div>
      </FilterSection>

      <FilterSection title="Power">
        <div className="flex items-center gap-2">
          <RangeInput placeholder="Min hp" rangeKey="min" defaultValue={numberField("powerHpMin")} onBlur={setRange("powerHpMin", "powerHpMax")} />
          <span className="text-fg-subtle">–</span>
          <RangeInput placeholder="Max hp" rangeKey="max" defaultValue={numberField("powerHpMax")} onBlur={setRange("powerHpMin", "powerHpMax")} />
        </div>
      </FilterSection>

      <FilterSection title="Fuel Type">
        {FUEL_TYPES.map(([value, label]) => (
          <CheckboxRow key={value} checked={getList("fuelTypes").includes(value)} onCheckedChange={() => update((params) => toggleInList(params, "fuelTypes", value))}>
            {label}
          </CheckboxRow>
        ))}
      </FilterSection>

      <FilterSection title="Transmission" defaultOpen={false}>
        {TRANSMISSIONS.map(([value, label]) => (
          <CheckboxRow key={value} checked={getList("transmissions").includes(value)} onCheckedChange={() => update((params) => toggleInList(params, "transmissions", value))}>
            {label}
          </CheckboxRow>
        ))}
      </FilterSection>

      <FilterSection title="Body Style" defaultOpen={false}>
        {BODY_TYPES.map(([value, label]) => (
          <CheckboxRow key={value} checked={getList("bodyTypes").includes(value)} onCheckedChange={() => update((params) => toggleInList(params, "bodyTypes", value))}>
            {label}
          </CheckboxRow>
        ))}
      </FilterSection>

      <FilterSection title="Drivetrain" defaultOpen={false}>
        {DRIVETRAINS.map(([value, label]) => (
          <CheckboxRow key={value} checked={getList("drivetrains").includes(value)} onCheckedChange={() => update((params) => toggleInList(params, "drivetrains", value))}>
            {label}
          </CheckboxRow>
        ))}
      </FilterSection>

      <FilterSection title="Location" defaultOpen={false}>
        {facets.locations.map((loc) => (
          <CheckboxRow key={loc} checked={getList("locations").includes(loc)} onCheckedChange={() => update((params) => toggleInList(params, "locations", loc))}>
            {loc}
          </CheckboxRow>
        ))}
      </FilterSection>

      <FilterSection title="Marketplace" defaultOpen={false}>
        {facets.providers.map((p) => (
          <CheckboxRow key={p.id} checked={getList("providers").includes(p.id)} onCheckedChange={() => update((params) => toggleInList(params, "providers", p.id))}>
            {p.name}
          </CheckboxRow>
        ))}
      </FilterSection>

      <FilterSection title="Seller" defaultOpen={false}>
        {SELLER_TYPES.map(([value, label]) => (
          <CheckboxRow key={value} checked={getList("sellerTypes").includes(value)} onCheckedChange={() => update((params) => toggleInList(params, "sellerTypes", value))}>
            {label}
          </CheckboxRow>
        ))}
      </FilterSection>
    </div>
  );
}

function RangeInput({
  placeholder,
  rangeKey,
  defaultValue,
  onBlur,
}: {
  placeholder: string;
  rangeKey: "min" | "max";
  defaultValue: string;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      defaultValue={defaultValue}
      data-range-key={rangeKey}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="h-8 text-xs"
    />
  );
}
