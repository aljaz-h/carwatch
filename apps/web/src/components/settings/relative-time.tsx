/**
 * Minute/second-precision relative time for the diagnostics UI ("4 minutes
 * ago", "in 11 minutes") — distinct from `formatRelativeAge` in
 * `@carwatch/shared`, which is day-precision and phrased for shoppers
 * looking at listing ages, not admins watching a scrape cycle.
 */
export function formatFineRelativeTime(iso: string | null, now: number = Date.now()): string {
  if (!iso) return "—";
  const diffMs = new Date(iso).getTime() - now;
  const future = diffMs > 0;
  const abs = Math.abs(diffMs);

  const seconds = Math.round(abs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  let phrase: string;
  if (seconds < 45) phrase = "a few seconds";
  else if (minutes < 60) phrase = `${minutes} minute${minutes === 1 ? "" : "s"}`;
  else if (hours < 24) phrase = `${hours} hour${hours === 1 ? "" : "s"}`;
  else phrase = `${days} day${days === 1 ? "" : "s"}`;

  return future ? `in ${phrase}` : `${phrase} ago`;
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
