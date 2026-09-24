"use client";

import type { FilterCriteria } from "@carwatch/shared";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createSavedSearchAction } from "@/app/(app)/saved-searches/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SaveSearchDialog({ criteria, suggestedName }: { criteria: FilterCriteria; suggestedName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(suggestedName);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = () => {
    startTransition(async () => {
      await createSavedSearchAction({ name: name.trim() || "Untitled search", required: criteria });
      toast.success("Saved search created", { description: name });
      setOpen(false);
      router.push("/saved-searches");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Bookmark className="h-3.5 w-3.5" />
          Save search
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save this search</DialogTitle>
          <DialogDescription>We&apos;ll notify you when new listings match these filters.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="search-name">Name</Label>
          <Input id="search-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Golf / Octavia / Leon" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save search"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
