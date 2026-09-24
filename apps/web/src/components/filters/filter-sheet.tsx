"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { FacetData } from "./filter-sidebar";
import { FilterSidebar } from "./filter-sidebar";

export function FilterSheet({ facets, activeCount }: { facets: FacetData; activeCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">
            {activeCount}
          </span>
        )}
      </Button>
      <SheetContent side="bottom" className="flex max-h-[85vh] flex-col p-0">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <FilterSidebar facets={facets} />
        </div>
        <div className="border-t border-border p-4">
          <Button className="w-full" onClick={() => setOpen(false)}>
            Show results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
