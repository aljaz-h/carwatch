"use client";

import { formatPrice } from "@carwatch/shared";
import { useMemo, useState } from "react";

interface PricePoint {
  price: number;
  recordedAt: string;
}

const WIDTH = 640;
const HEIGHT = 180;
const PAD_X = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

export function PriceHistoryChart({ points }: { points: PricePoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { path, areaPath, coords, minPrice, maxPrice } = useMemo(() => {
    if (points.length === 0) return { path: "", areaPath: "", coords: [], minPrice: 0, maxPrice: 0 };

    const times = points.map((p) => new Date(p.recordedAt).getTime());
    const prices = points.map((p) => p.price);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const priceRange = maxP - minP || 1;
    const timeRange = maxT - minT || 1;

    const xFor = (t: number) => PAD_X + ((t - minT) / timeRange) * (WIDTH - PAD_X * 2);
    const yFor = (p: number) => PAD_TOP + (1 - (p - minP) / priceRange) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

    const coords = points.map((p, i) => ({ x: xFor(times[i]!), y: yFor(p.price), ...p }));
    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
    const areaPath = `${path} L ${coords[coords.length - 1]!.x.toFixed(1)} ${HEIGHT - PAD_BOTTOM} L ${coords[0]!.x.toFixed(1)} ${HEIGHT - PAD_BOTTOM} Z`;

    return { path, areaPath, coords, minPrice: minP, maxPrice: maxP };
  }, [points]);

  if (points.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-fg-subtle">No price history yet</div>;
  }

  const hovered = hoverIndex !== null ? coords[hoverIndex] : coords[coords.length - 1];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-lg font-semibold text-fg">{hovered ? formatPrice(hovered.price) : ""}</span>
        <span className="text-xs text-fg-subtle">{hovered ? new Date(hovered.recordedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}</span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
          let closest = 0;
          let closestDist = Infinity;
          coords.forEach((c, i) => {
            const dist = Math.abs(c.x - relX);
            if (dist < closestDist) {
              closestDist = dist;
              closest = i;
            }
          });
          setHoverIndex(closest);
        }}
      >
        <defs>
          <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1={PAD_X} y1={HEIGHT - PAD_BOTTOM} x2={WIDTH - PAD_X} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-border)" strokeWidth="1" />

        <path d={areaPath} fill="url(#price-fill)" />
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === hoverIndex ? 4 : 2.5}
            fill={i === hoverIndex ? "var(--color-accent)" : "var(--color-surface)"}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          />
        ))}

        {hoverIndex !== null && coords[hoverIndex] && (
          <line x1={coords[hoverIndex]!.x} y1={PAD_TOP} x2={coords[hoverIndex]!.x} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-border-strong)" strokeWidth="1" strokeDasharray="3 3" />
        )}
      </svg>
      <div className="flex justify-between text-[11px] text-fg-subtle">
        <span>{formatPrice(minPrice)}</span>
        <span>{formatPrice(maxPrice)}</span>
      </div>
    </div>
  );
}
