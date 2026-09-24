import { formatMileage, formatPower, formatPrice, formatRelativeAge } from "@carwatch/shared";
import { ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import { Gallery } from "@/components/vehicle/gallery";
import { ListingCard } from "@/components/vehicle/listing-card";
import { ListingTimeline } from "@/components/vehicle/listing-timeline";
import { OtherMarketplaces } from "@/components/vehicle/other-marketplaces";
import { SpecList } from "@/components/vehicle/spec-list";
import { WatchlistButton } from "@/components/vehicle/watchlist-button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getListingDetail, getOtherMarketplaceListings, getSimilarListings } from "@/lib/query-listing-detail";

const FUEL_LABELS: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in hybrid",
  LPG: "LPG",
  CNG: "CNG",
  OTHER: "Other",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Automatic",
  SEMI_AUTOMATIC: "Semi-automatic",
};

const DRIVETRAIN_LABELS: Record<string, string> = { FWD: "Front-wheel drive", RWD: "Rear-wheel drive", AWD: "All-wheel drive" };

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [listing, user] = await Promise.all([getListingDetail(id), getCurrentUser()]);
  if (!listing) notFound();

  const { vehicle } = listing;

  const [similar, otherMarketplaces, watchlistItem] = await Promise.all([
    getSimilarListings({ manufacturer: vehicle.manufacturer, model: vehicle.model, excludeId: listing.id }),
    getOtherMarketplaceListings(listing.id),
    user ? prisma.watchlistItem.findUnique({ where: { userId_listingId: { userId: user.id, listingId: listing.id } } }) : null,
  ]);

  const title = `${vehicle.manufacturer} ${vehicle.model}`;
  const subtitle = [vehicle.variant, vehicle.generation].filter(Boolean).join(" · ");
  const hasPriceDrop = listing.originalPrice !== null && listing.originalPrice > listing.price;
  const location = [listing.locationCity, listing.locationCountry].filter(Boolean).join(", ");

  const specItems = [
    vehicle.year && { label: "Year", value: String(vehicle.year) },
    listing.mileage !== null && { label: "Mileage", value: formatMileage(listing.mileage) },
    vehicle.fuelType && { label: "Fuel", value: FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType },
    vehicle.transmission && { label: "Transmission", value: TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission },
    vehicle.powerKw && vehicle.powerHp && { label: "Power", value: `${vehicle.powerKw} kW (${formatPower(vehicle.powerHp)})` },
    vehicle.engineCapacity && { label: "Engine", value: `${vehicle.engineCapacity} cc` },
    vehicle.drivetrain && { label: "Drivetrain", value: DRIVETRAIN_LABELS[vehicle.drivetrain] ?? vehicle.drivetrain },
    vehicle.bodyType && { label: "Body style", value: vehicle.bodyType.charAt(0) + vehicle.bodyType.slice(1).toLowerCase() },
    vehicle.doors && { label: "Doors", value: String(vehicle.doors) },
    vehicle.seats && { label: "Seats", value: String(vehicle.seats) },
    vehicle.exteriorColor && { label: "Color", value: vehicle.exteriorColor },
    vehicle.firstRegistration && { label: "First registration", value: vehicle.firstRegistration.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) },
    vehicle.vin && { label: "VIN", value: vehicle.vin },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Gallery images={listing.images} alt={`${title} ${subtitle}`} manufacturer={vehicle.manufacturer} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
                {subtitle && <p className="text-sm text-fg-muted">{subtitle}</p>}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-fg">{formatPrice(listing.price)}</span>
                {hasPriceDrop && listing.originalPrice && (
                  <span className="text-sm text-fg-subtle line-through">{formatPrice(listing.originalPrice)}</span>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-fg-muted">
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {location}
                </span>
              )}
              <span>{listing.sellerName ?? "Seller not listed"}</span>
              <Badge variant="outline">{listing.provider.name}</Badge>
              <span>Listed {formatRelativeAge(listing.firstSeenAt.toISOString())}</span>
            </div>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-fg">Specifications</h2>
            <SpecList items={specItems} />
          </section>

          {vehicle.features.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-fg">Equipment</h2>
              <div className="flex flex-wrap gap-1.5">
                {vehicle.features.map((vf) => (
                  <Badge key={vf.featureId}>{vf.feature.label}</Badge>
                ))}
              </div>
            </section>
          )}

          {listing.description && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-fg">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-fg-muted">{listing.description}</p>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold text-fg">Price history</h2>
            <div className="rounded-lg border border-border bg-surface p-4">
              <PriceHistoryChart points={listing.priceHistory.map((p) => ({ price: p.price, recordedAt: p.recordedAt.toISOString() }))} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-fg">Listing history</h2>
            <ListingTimeline
              priceHistory={listing.priceHistory}
              statusHistory={listing.statusHistory}
              mileageHistory={listing.mileageHistory}
              firstSeenAt={listing.firstSeenAt}
            />
          </section>

          {otherMarketplaces.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-fg">Also seen on other marketplaces</h2>
              <OtherMarketplaces offers={otherMarketplaces} />
            </section>
          )}

          {similar.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-fg">Similar listings</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {similar.map((s) => (
                  <ListingCard key={s.id} listing={s} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
            <span className="text-2xl font-semibold text-fg">{formatPrice(listing.price)}</span>
            {hasPriceDrop && listing.originalPrice && (
              <span className="text-xs text-success">
                Reduced from {formatPrice(listing.originalPrice)} (↓ {formatPrice(listing.originalPrice - listing.price)})
              </span>
            )}
            <div className="mt-2 flex flex-col gap-2">
              <WatchlistButton listingId={listing.id} initialWatched={!!watchlistItem} />
              <Button variant="secondary" asChild>
                <Link href={listing.url} target="_blank" rel="noopener noreferrer">
                  View original listing
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <Separator className="my-1" />
            <dl className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Marketplace</dt>
                <dd className="text-fg">{listing.provider.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Seller</dt>
                <dd className="text-fg">{listing.sellerType === "DEALER" ? "Dealer" : listing.sellerType === "PRIVATE" ? "Private" : "Unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">First seen</dt>
                <dd className="text-fg">{listing.firstSeenAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Last seen</dt>
                <dd className="text-fg">{listing.lastSeenAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
