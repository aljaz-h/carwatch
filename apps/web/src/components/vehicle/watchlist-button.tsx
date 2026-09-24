"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleWatchlistAction } from "@/app/(app)/listings/[id]/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WatchlistButton({ listingId, initialWatched }: { listingId: string; initialWatched: boolean }) {
  const [watched, setWatched] = useState(initialWatched);
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={watched ? "secondary" : "outline"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleWatchlistAction(listingId);
          setWatched(result.watched);
          toast.success(result.watched ? "Added to watchlist" : "Removed from watchlist");
        })
      }
    >
      <Star className={cn("h-4 w-4", watched && "fill-accent text-accent")} />
      {watched ? "Watching" : "Watch"}
    </Button>
  );
}
