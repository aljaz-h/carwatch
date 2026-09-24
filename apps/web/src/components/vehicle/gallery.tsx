"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { VehicleImage } from "./vehicle-image";

export function Gallery({ images, alt, manufacturer }: { images: string[]; alt: string; manufacturer: string }) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [undefined];

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-border">
        <VehicleImage src={list[active]} alt={alt} manufacturer={manufacturer} className="h-full w-full" eager />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                i === active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <VehicleImage src={img} alt={`${alt} thumbnail ${i + 1}`} manufacturer={manufacturer} className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
