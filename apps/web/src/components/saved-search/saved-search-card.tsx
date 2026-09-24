"use client";

import type { FilterCriteria } from "@carwatch/shared";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteSavedSearchAction, updateSavedSearchAction } from "@/app/(app)/saved-searches/actions";
import { Switch } from "@/components/ui/switch";
import { CriteriaSummary } from "./criteria-summary";

export interface SavedSearchCardData {
  id: string;
  name: string;
  isActive: boolean;
  required: FilterCriteria;
  matchCount: number;
}

export function SavedSearchCard({ search }: { search: SavedSearchCardData }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/saved-searches/${search.id}`} className="text-sm font-semibold text-fg hover:text-accent">
            {search.name}
          </Link>
          <p className="mt-0.5 text-xs text-fg-subtle">
            {search.matchCount} match{search.matchCount === 1 ? "" : "es"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={search.isActive}
            disabled={pending}
            onCheckedChange={(checked) =>
              startTransition(async () => {
                await updateSavedSearchAction(search.id, { isActive: checked });
                router.refresh();
              })
            }
          />
          <button
            className="text-fg-subtle transition-colors hover:text-danger"
            onClick={() =>
              startTransition(async () => {
                await deleteSavedSearchAction(search.id);
                toast.success("Saved search deleted");
                router.refresh();
              })
            }
            aria-label="Delete saved search"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <CriteriaSummary criteria={search.required} />
    </div>
  );
}
