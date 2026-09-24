/**
 * CarWatch has no real photography until a provider scrape supplies image URLs.
 * Rather than hotlink third-party stock photos (fragile, and not what a real
 * scraped listing would have), we generate a small set of distinctive inline
 * illustrations per listing using a lightweight custom URI scheme that the
 * web app's <VehicleImage> component renders as SVG. Real provider images are
 * ordinary http(s) URLs and render as normal <img>/<Image> elements.
 */
export const PLACEHOLDER_SCHEME = "cwph";

export type PlaceholderShot = "side" | "front" | "rear" | "interior";

export function buildPlaceholderImageUri(params: { shot: PlaceholderShot; colorHex: string; seed: string }): string {
  const color = params.colorHex.replace("#", "");
  return `${PLACEHOLDER_SCHEME}://${params.shot}/${color}/${encodeURIComponent(params.seed)}`;
}

export function isPlaceholderImageUri(url: string): boolean {
  return url.startsWith(`${PLACEHOLDER_SCHEME}://`);
}

export function parsePlaceholderImageUri(url: string): { shot: PlaceholderShot; colorHex: string; seed: string } | null {
  if (!isPlaceholderImageUri(url)) return null;
  const rest = url.slice(`${PLACEHOLDER_SCHEME}://`.length);
  const [shot, colorHex, seed] = rest.split("/");
  if (!shot || !colorHex || !seed) return null;
  return { shot: shot as PlaceholderShot, colorHex: `#${colorHex}`, seed: decodeURIComponent(seed) };
}

/** Maps a free-text exterior color name to a representative hex swatch used by the placeholder illustration. */
export const COLOR_NAME_TO_HEX: Record<string, string> = {
  "reflex silver": "#9aa0a6",
  "deep black": "#1c1c1f",
  "glacier white": "#eef1f3",
  "magnetic grey": "#5a5f66",
  "moonlight blue": "#2f4a6b",
  "quartz grey": "#6b6d70",
  "corrida red": "#8c2c2c",
  "brilliant black": "#161618",
  "nardo grey": "#83807a",
  "racing green": "#2c4a3a",
  "titanium grey": "#71716f",
  "phantom black": "#101012",
  "celestial silver": "#a8adb3",
};

export function colorNameToHex(name: string | undefined): string {
  if (!name) return "#8a8d91";
  return COLOR_NAME_TO_HEX[name.toLowerCase()] ?? "#8a8d91";
}
