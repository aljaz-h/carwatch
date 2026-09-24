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

/**
 * True when the page still has the results container CarWatch's parser
 * relies on, whether or not it currently holds any rows. A page that lacks
 * this container entirely (while still returning HTTP 200) is a strong
 * signal that Avto.net changed its markup, as opposed to a search that
 * legitimately matched zero listings.
 */
export function hasExpectedSearchStructure(html: string): boolean {
  const $ = cheerio.load(html);
  return $(".GO-Results").length > 0;
}

/**
 * A short, human-readable summary of a page that failed
 * `hasExpectedSearchStructure` — the page's `<title>` and a snippet of its
 * visible text — attached to `ParserStructureError.message` so it shows up
 * in the run's "Advanced details". Without this, the failure just says
 * "the container wasn't found" with no way to tell a cookie-consent wall,
 * a CAPTCHA/interstitial, or a genuine markup change apart after the fact.
 */
export function describeUnexpectedPage(html: string): string {
  const $ = cheerio.load(html);
  const title = $("title").text().trim().replace(/\s+/g, " ").slice(0, 100);
  const bodyText = $("body").text().trim().replace(/\s+/g, " ").slice(0, 200);
  return `title="${title || "(none)"}" excerpt="${bodyText || "(empty)"}"`;
}
