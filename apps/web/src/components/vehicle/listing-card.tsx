import { formatMileage, formatPrice, formatRelativeAge } from "@carwatch/shared";
import { Cog, Fuel, Gauge, MapPin, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ListingWithRelations } from "@/lib/query-listings";
import { VehicleImage } from "./vehicle-image";

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
  SEMI_AUTOMATIC: "Semi-auto",
};

interface ListingCardProps {
  listing: ListingWithRelations;
  view?: "grid" | "list";
  matchScore?: number;
  isWatched?: boolean;
  className?: string;
}

export function ListingCard({ listing, view = "grid", matchScore, isWatched, className }: ListingCardProps) {
  const { vehicle } = listing;
  const isNew = Date.now() - listing.firstSeenAt.getTime() < 1000 * 60 * 60 * 48;
  const hasPriceDrop = listing.originalPrice !== null && listing.originalPrice > listing.price;
  const priceDelta = hasPriceDrop ? listing.originalPrice! - listing.price : 0;

  const title = `${vehicle.manufacturer} ${vehicle.model}`;
  const subtitle = [vehicle.variant, vehicle.generation].filter(Boolean).join(" · ");

  const specs = [
    vehicle.year ? { icon: null, label: String(vehicle.year) } : null,
    listing.mileage !== null ? { icon: Gauge, label: formatMileage(listing.mileage) } : null,
    vehicle.fuelType ? { icon: Fuel, label: FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType } : null,
    vehicle.transmission ? { icon: Cog, label: TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission } : null,
    vehicle.powerHp ? { icon: Zap, label: `${vehicle.powerHp} hp` } : null,
  ].filter(Boolean) as { icon: typeof Gauge | null; label: string }[];

  const badges: React.ReactNode[] = [];
  if (typeof matchScore === "number") {
    badges.push(
      <Badge key="match" variant="accent">
        {matchScore}% match
      </Badge>,
    );
  }
  if (isNew) badges.push(<Badge key="new">New</Badge>);
  if (hasPriceDrop) badges.push(<Badge key="drop" variant="success">Price drop</Badge>);
  if (isWatched) badges.push(<Badge key="watched" variant="outline">Watched</Badge>);

  const imageAlt = `${title} ${subtitle}`.trim();

  if (view === "list") {
    return (
      <Link
        href={`/listings/${listing.id}`}
        className={cn(
          "group flex gap-4 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-surface-2",
          className,
        )}
      >
        <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-md">
          <VehicleImage src={listing.images[0]} alt={imageAlt} manufacturer={vehicle.manufacturer} className="h-full w-full" />
          {badges.length > 0 && <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">{badges}</div>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="truncate text-sm font-semibold text-fg">{title}</h3>
              <PriceBlock price={listing.price} originalPrice={listing.originalPrice} priceDelta={priceDelta} hasPriceDrop={hasPriceDrop} compact />
            </div>
            {subtitle && <p className="truncate text-xs text-fg-subtle">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
            {specs.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {s.icon && <s.icon className="h-3.5 w-3.5" />}
                {s.label}
              </span>
            ))}
          </div>
          <Footer listing={listing} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong hover:bg-surface-2",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <VehicleImage
          src={listing.images[0]}
          alt={imageAlt}
          manufacturer={vehicle.manufacturer}
          className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {badges.length > 0 && <div className="absolute left-2 top-2 flex flex-wrap gap-1">{badges}</div>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight text-fg">{title}</h3>
          </div>
          {subtitle && <p className="truncate text-xs text-fg-subtle">{subtitle}</p>}
        </div>

        <PriceBlock price={listing.price} originalPrice={listing.originalPrice} priceDelta={priceDelta} hasPriceDrop={hasPriceDrop} />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
          {specs.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              {s.icon && <s.icon className="h-3.5 w-3.5" />}
              {s.label}
            </span>
          ))}
        </div>

        <Footer listing={listing} />
      </div>
    </Link>
  );
}

function PriceBlock({
  price,
  originalPrice,
  priceDelta,
  hasPriceDrop,
  compact,
}: {
  price: number;
  originalPrice: number | null;
  priceDelta: number;
  hasPriceDrop: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline gap-2", compact && "shrink-0")}>
      <span className={cn("font-semibold text-fg", compact ? "text-sm" : "text-lg")}>{formatPrice(price)}</span>
      {hasPriceDrop && originalPrice && (
        <>
          <span className="text-xs text-fg-subtle line-through">{formatPrice(originalPrice)}</span>
          <span className="text-xs font-medium text-success">↓ {formatPrice(priceDelta)}</span>
        </>
      )}
    </div>
  );
}

function Footer({ listing }: { listing: ListingWithRelations }) {
  const location = [listing.locationCity, listing.locationCountry].filter(Boolean).join(", ");
  return (
    <div className="mt-auto flex items-center justify-between border-t border-border pt-2 text-[11px] text-fg-subtle">
      <span className="inline-flex items-center gap-1 truncate">
        {location && (
          <>
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{location}</span>
          </>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <span>{listing.provider.name}</span>
        <span className="text-fg-subtle/50">·</span>
        <span>{formatRelativeAge(listing.firstSeenAt.toISOString())}</span>
      </span>
    </div>
  );
}
