/** Avto.net formats numbers with `.` as thousands separator (e.g. "121.000 km", "11.900 €"). */
export function parseSloveneNumber(text: string | undefined | null): number | undefined {
  if (!text) return undefined;
  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  return Number.parseInt(digits, 10);
}

/** "05/2017" -> "2017-05-01" */
export function parseMonthYear(text: string | undefined | null): string | undefined {
  if (!text) return undefined;
  const match = text.trim().match(/^(\d{1,2})\/(\d{4})$/);
  if (!match) return undefined;
  const [, month, year] = match;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/** "14.07.2025" -> "2025-07-14" */
export function parseSloveneDate(text: string | undefined | null): string | undefined {
  if (!text) return undefined;
  const match = text.trim().match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return undefined;
  const [, day, month, year] = match;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "85 kW (115 KM)" -> { kw: 85, hp: 115 } */
export function parsePower(text: string | undefined | null): { kw?: number; hp?: number } {
  if (!text) return {};
  const kwMatch = text.match(/(\d+)\s*kW/i);
  const hpMatch = text.match(/(\d+)\s*KM/i);
  return {
    kw: kwMatch?.[1] ? Number.parseInt(kwMatch[1], 10) : undefined,
    hp: hpMatch?.[1] ? Number.parseInt(hpMatch[1], 10) : undefined,
  };
}

export function normalizeImageUrl(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("//")) return `https:${src}`;
  return src;
}
