"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMileage, formatPrice } from "@carwatch/shared";

const RANGE_KEYS: [string, string, string, (v: number) => string][] = [
  ["priceMin", "priceMax", "Price", (v) => formatPrice(v)],
  ["yearMin", "yearMax", "Year", (v) => String(v)],
  ["mileageMin", "mileageMax", "Mileage", (v) => formatMileage(v)],
  ["powerHpMin", "powerHpMax", "Power", (v) => `${v} hp`],
];

const LIST_KEYS = ["manufacturers", "models", "fuelTypes", "transmissions", "bodyTypes", "drivetrains", "locations", "sellerTypes"];

export function ActiveFilterChips({ providerNames }: { providerNames: Record<string, string> }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const removeValue = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined) {
      params.delete(key);
    } else {
      const list = (params.get(key) ?? "").split(",").filter((v) => v && v !== value);
      if (list.length > 0) params.set(key, list.join(","));
      else params.delete(key);
    }
    params.delete("page");
    router.push(`/browse?${params.toString()}`, { scroll: false });
  };

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const key of LIST_KEYS) {
    const values = searchParams.get(key)?.split(",").filter(Boolean) ?? [];
    for (const v of values) {
      chips.push({ key: `${key}:${v}`, label: v.replaceAll("_", " "), onRemove: () => removeValue(key, v) });
    }
  }

  const providers = searchParams.get("providers")?.split(",").filter(Boolean) ?? [];
  for (const p of providers) {
    chips.push({ key: `providers:${p}`, label: providerNames[p] ?? p, onRemove: () => removeValue("providers", p) });
  }

  const q = searchParams.get("q");
  if (q) chips.push({ key: "q", label: `“${q}”`, onRemove: () => removeValue("q") });

  for (const [minKey, maxKey, label, fmt] of RANGE_KEYS) {
    const min = searchParams.get(minKey);
    const max = searchParams.get(maxKey);
    if (min || max) {
      const text = min && max ? `${label} ${fmt(Number(min))}–${fmt(Number(max))}` : min ? `${label} ≥ ${fmt(Number(min))}` : `${label} ≤ ${fmt(Number(max))}`;
      chips.push({
        key: `${minKey}-${maxKey}`,
        label: text,
        onRemove: () => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete(minKey);
          params.delete(maxKey);
          params.delete("page");
          router.push(`/browse?${params.toString()}`, { scroll: false });
        },
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface-2 px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-danger/40 hover:text-danger"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
