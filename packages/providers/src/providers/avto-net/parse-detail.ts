import * as cheerio from "cheerio";
import { normalizeImageUrl, parseSloveneNumber } from "./parse-utils";

export interface AvtoNetRawDetail {
  title: string;
  price?: number;
  priceOld?: number;
  specs: Record<string, string>;
  equipment: string[];
  description?: string;
  contact: {
    name?: string;
    type?: string;
    phone?: string;
    location?: string;
  };
  images: string[];
  publishedText?: string;
}

/** Parses an Avto.net listing detail page into a structured (but still marketplace-shaped) payload. */
export function parseDetailPage(html: string): AvtoNetRawDetail {
  const $ = cheerio.load(html);

  const title = $(".GO-Detail-Title").first().text().trim();
  const price = parseSloveneNumber($(".GO-Detail-Price").first().text());
  const priceOldText = $(".GO-Detail-PriceOld").first().text();
  const priceOld = priceOldText ? parseSloveneNumber(priceOldText) : undefined;

  const specs: Record<string, string> = {};
  $(".GO-Detail-Specs tr").each((_, row) => {
    const label = $(row).find("td.label").first().text().trim();
    const value = $(row).find("td.value").first().text().trim();
    if (label && value) specs[label] = value;
  });

  const equipment: string[] = [];
  $(".GO-Oprema li").each((_, el) => {
    const text = $(el).text().trim();
    if (text) equipment.push(text);
  });

  const description = $(".GO-Detail-Description").first().text().trim() || undefined;

  const contact = {
    name: $(".GO-Contact-Name").first().text().trim() || undefined,
    type: $(".GO-Contact-Type").first().text().trim() || undefined,
    phone: $(".GO-Contact-Phone").first().text().trim() || undefined,
    location: $(".GO-Contact-Location").first().text().trim() || undefined,
  };

  const images: string[] = [];
  $(".GO-Detail-Gallery img").each((_, el) => {
    const src = normalizeImageUrl($(el).attr("src"));
    if (src) images.push(src);
  });

  const publishedText = $(".GO-Detail-Published").first().text().replace("Objavljeno:", "").trim() || undefined;

  return { title, price, priceOld, specs, equipment, description, contact, images, publishedText };
}
