import { ListingCardSkeleton } from "@/components/vehicle/listing-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
