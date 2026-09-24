"use client";

import type { FilterCriteria } from "@carwatch/shared";
import { LayoutGrid, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FacetData } from "@/components/filters/filter-sidebar";
import { FilterSheet } from "@/components/filters/filter-sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SaveSearchDialog } from "./save-search-dialog";

const SORT_OPTIONS: [string, string][] = [
  ["newest", "Newest"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["mileage_asc", "Mileage: low to high"],
  ["year_desc", "Year: newest first"],
  ["recently_reduced", "Recently reduced"],
];

export function BrowseToolbar({
  total,
  view,
  facets,
  activeFilterCount,
  criteria,
  suggestedName,
}: {
  total: number;
  view: "grid" | "list";
  facets: FacetData;
  activeFilterCount: number;
  criteria: FilterCriteria;
  suggestedName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/browse?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <FilterSheet facets={facets} activeCount={activeFilterCount} />
        <p className="text-sm text-fg-muted">
          <span className="font-medium text-fg">{total.toLocaleString("en-US")}</span> listing{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <SaveSearchDialog criteria={criteria} suggestedName={suggestedName} />

        <Select value={searchParams.get("sort") ?? "newest"} onValueChange={(v) => setParam("sort", v)}>
          <SelectTrigger className="h-8 w-[170px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center rounded-md border border-border-strong bg-surface-2 p-0.5">
          <button
            onClick={() => setParam("view", "grid")}
            className={cn("rounded p-1.5 transition-colors", view === "grid" ? "bg-surface-3 text-fg" : "text-fg-subtle hover:text-fg")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setParam("view", "list")}
            className={cn("rounded p-1.5 transition-colors", view === "list" ? "bg-surface-3 text-fg" : "text-fg-subtle hover:text-fg")}
            aria-label="List view"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
