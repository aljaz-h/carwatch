import { formatMileage, formatPrice } from "@carwatch/shared";
import type { NotificationPayload } from "./types";

interface ListingSummary {
  title: string;
  price: number;
  year?: number;
  mileage?: number;
  url: string;
  imageUrl?: string;
}

export function buildNewMatchPayload(listing: ListingSummary, score: number, savedSearchName: string): NotificationPayload {
  return {
    type: "NEW_MATCH",
    title: `New ${score}% match: ${listing.title}`,
    body: `A new listing matches your saved search "${savedSearchName}".`,
    url: listing.url,
    imageUrl: listing.imageUrl,
    fields: [
      { label: "Price", value: formatPrice(listing.price) },
      ...(listing.year ? [{ label: "Year", value: String(listing.year) }] : []),
      ...(listing.mileage ? [{ label: "Mileage", value: formatMileage(listing.mileage) }] : []),
      { label: "Match score", value: `${score}%` },
    ],
  };
}

export function buildPriceDropPayload(listing: ListingSummary, oldPrice: number, newPrice: number): NotificationPayload {
  const delta = oldPrice - newPrice;
  return {
    type: "PRICE_DROP",
    title: `Price drop: ${listing.title}`,
    body: `Price reduced from ${formatPrice(oldPrice)} to ${formatPrice(newPrice)} (-${formatPrice(delta)}).`,
    url: listing.url,
    imageUrl: listing.imageUrl,
    fields: [
      { label: "New price", value: formatPrice(newPrice) },
      { label: "Was", value: formatPrice(oldPrice) },
      { label: "Change", value: `-${formatPrice(delta)}` },
    ],
  };
}

export function buildListingReturnedPayload(listing: ListingSummary, inactiveDays: number): NotificationPayload {
  return {
    type: "LISTING_RETURNED",
    title: `Listing returned: ${listing.title}`,
    body: `This listing is available again after being inactive for ${inactiveDays} day${inactiveDays === 1 ? "" : "s"}.`,
    url: listing.url,
    imageUrl: listing.imageUrl,
    fields: [{ label: "Price", value: formatPrice(listing.price) }],
  };
}

export function buildSignificantChangePayload(listing: ListingSummary, field: string, oldValue: string, newValue: string): NotificationPayload {
  return {
    type: "SIGNIFICANT_CHANGE",
    title: `Listing updated: ${listing.title}`,
    body: `${field} changed.`,
    url: listing.url,
    imageUrl: listing.imageUrl,
    fields: [
      { label: "Was", value: oldValue },
      { label: "Now", value: newValue },
    ],
  };
}

export function buildGoodDealPayload(listing: ListingSummary, percentBelowMarket: number): NotificationPayload {
  return {
    type: "GOOD_DEAL",
    title: `Potential good deal: ${listing.title}`,
    body: `Priced ${percentBelowMarket}% below comparable listings.`,
    url: listing.url,
    imageUrl: listing.imageUrl,
    fields: [
      { label: "Price", value: formatPrice(listing.price) },
      { label: "Below market", value: `${percentBelowMarket}%` },
    ],
  };
}
