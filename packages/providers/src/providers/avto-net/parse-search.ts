import * as cheerio from "cheerio";
import type { SearchResultItem } from "../../types";
import { normalizeImageUrl, parseSloveneNumber } from "./parse-utils";

const BASE_URL = "https://www.avto.net";

/** Parses an Avto.net search results page into lightweight search result items. */
export function parseSearchPage(html: string): SearchResultItem[] {
  const $ = cheerio.load(html);
  const items: SearchResultItem[] = [];

  $(".GO-Results-Row").each((_, el) => {
    const row = $(el);
    const providerListingId = row.attr("data-oglas-id")?.trim();
    const link = row.find(".GO-Results-Naziv").first();
    const href = link.attr("href");
    if (!providerListingId || !href) return;

    const title = link.text().trim();
    const price = parseSloveneNumber(row.find(".GO-Results-Price").first().text());
    const year = parseSloveneNumber(row.find(".regYear").first().text());
    const mileage = parseSloveneNumber(row.find(".mileage").first().text());
    const thumbnailUrl = normalizeImageUrl(row.find(".GO-Results-Image").first().attr("src"));

    items.push({
      providerListingId,
      url: href.startsWith("http") ? href : `${BASE_URL}${href}`,
      hint: { title, price, year, mileage, thumbnailUrl },
    });
  });

  return items;
}

/** True while there is a "next page" link in pagination, i.e. more results to crawl. */
export function hasNextSearchPage(html: string, currentPage: number): boolean {
  const $ = cheerio.load(html);
  let hasNext = false;
  $(".GO-Pagination a").each((_, el) => {
    const pageNum = Number.parseInt($(el).text().trim(), 10);
    if (Number.isFinite(pageNum) && pageNum > currentPage) hasNext = true;
  });
  return hasNext;
}
