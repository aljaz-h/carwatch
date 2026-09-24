import type { PlaceholderShot } from "@carwatch/shared";

function seededFraction(seed: string, salt: string): number {
  let hash = 0;
  const input = seed + salt;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash / 0xffffffff;
}

const CAR_PATH =
  "M18 62c0-3 2-5 5-6l7-2 9-14c2-3 5-5 9-5h32c4 0 7 2 9 5l9 14 7 2c3 1 5 3 5 6v10c0 2-2 4-4 4h-6c0 6-5 11-11 11s-11-5-11-11H50c0 6-5 11-11 11s-11-5-11-11h-6c-2 0-4-2-4-4V62Z";

interface PlaceholderArtProps {
  shot: PlaceholderShot;
  colorHex: string;
  seed: string;
  manufacturer?: string;
  className?: string;
}

/**
 * Designed stand-in for a listing photo we don't have yet (no provider scrape
 * has supplied one). Renders as inline SVG — deterministic per listing/shot so
 * it stays stable across renders, distinct enough per image that a gallery of
 * four doesn't look identical, and never shows a broken-image icon.
 */
export function PlaceholderArt({ shot, colorHex, seed, manufacturer, className }: PlaceholderArtProps) {
  const angle = Math.round(seededFraction(seed, shot) * 60) + 100;
  const glowX = 20 + seededFraction(seed, `${shot}-x`) * 60;
  const glowY = 15 + seededFraction(seed, `${shot}-y`) * 40;
  const gradientId = `g-${shot}-${seed.replace(/[^a-zA-Z0-9]/g, "")}`;
  const glowId = `r-${shot}-${seed.replace(/[^a-zA-Z0-9]/g, "")}`;

  const carTransform =
    shot === "side"
      ? "translate(0,4) scale(1)"
      : shot === "front"
        ? "translate(-18,10) scale(1.35)"
        : shot === "rear"
          ? "translate(18,10) scale(1.35) scale(-1,1) translate(-100,0)"
          : "translate(0,0) scale(1)";

  return (
    <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${manufacturer ?? "Vehicle"} — ${shot} view placeholder`}>
      <defs>
        <linearGradient id={gradientId} gradientTransform={`rotate(${angle})`}>
          <stop offset="0%" stopColor="#1c1d21" />
          <stop offset="55%" stopColor="#17181b" />
          <stop offset="100%" stopColor={colorHex} stopOpacity="0.16" />
        </linearGradient>
        <radialGradient id={glowId} cx={`${glowX}%`} cy={`${glowY}%`} r="65%">
          <stop offset="0%" stopColor={colorHex} stopOpacity="0.35" />
          <stop offset="100%" stopColor={colorHex} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="100" height="100" fill={`url(#${gradientId})`} />
      <rect width="100" height="100" fill={`url(#${glowId})`} />

      {shot === "interior" ? (
        <g opacity="0.5" stroke={colorHex} strokeWidth="0.6" fill="none">
          <path d="M0 70 Q50 35 100 70" />
          <path d="M0 78 Q50 48 100 78" />
          <circle cx="50" cy="66" r="9" />
          <circle cx="50" cy="66" r="2" fill={colorHex} stroke="none" />
        </g>
      ) : (
        <g transform={carTransform} opacity="0.55" fill={colorHex} fillOpacity="0.28" stroke={colorHex} strokeOpacity="0.65" strokeWidth="1">
          <path d={CAR_PATH} />
        </g>
      )}

      <line x1="0" y1="76" x2="100" y2="76" stroke={colorHex} strokeOpacity="0.15" strokeWidth="0.5" />
    </svg>
  );
}
