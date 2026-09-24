import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ListingCardSkeleton({ view = "grid" }: { view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="flex gap-4 rounded-lg border border-border bg-surface p-3">
        <Skeleton className="h-28 w-40 shrink-0 rounded-md" />
        <div className="flex flex-1 flex-col justify-between py-0.5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-lg border border-border bg-surface")}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-2/3" />
      </div>
    </div>
  );
}
