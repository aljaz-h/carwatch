import { formatPrice } from "@carwatch/shared";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Bell, RefreshCcw, Sparkles, TrendingDown, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { VehicleImage } from "@/components/vehicle/vehicle-image";

const TYPE_META: Record<string, { icon: typeof Bell; label: string }> = {
  NEW_MATCH: { icon: Sparkles, label: "New match" },
  PRICE_DROP: { icon: ArrowDownCircle, label: "Price drop" },
  PRICE_INCREASE: { icon: ArrowUpCircle, label: "Price increase" },
  LISTING_RETURNED: { icon: RefreshCcw, label: "Listing returned" },
  LISTING_REMOVED: { icon: XCircle, label: "Listing removed" },
  SIGNIFICANT_CHANGE: { icon: AlertTriangle, label: "Listing updated" },
  GOOD_DEAL: { icon: TrendingDown, label: "Potential good deal" },
};

interface AlertEventData {
  id: string;
  type: string;
  status: string;
  createdAt: Date;
  payload: unknown;
  savedSearch: { id: string; name: string } | null;
  listing: { id: string; images: string[]; vehicle: { manufacturer: string; model: string } } | null;
}

function describeEvent(e: AlertEventData): string {
  const p = (e.payload ?? {}) as Record<string, unknown>;
  switch (e.type) {
    case "NEW_MATCH":
      return `Matched "${e.savedSearch?.name ?? "a saved search"}" at ${p.score ?? "?"}%`;
    case "PRICE_DROP":
      return typeof p.oldPrice === "number" && typeof p.newPrice === "number"
        ? `Reduced from ${formatPrice(p.oldPrice)} to ${formatPrice(p.newPrice)}`
        : "Price reduced";
    case "PRICE_INCREASE":
      return typeof p.oldPrice === "number" && typeof p.newPrice === "number"
        ? `Increased from ${formatPrice(p.oldPrice)} to ${formatPrice(p.newPrice)}`
        : "Price increased";
    case "LISTING_RETURNED":
      return "Back on the market after being unavailable";
    case "LISTING_REMOVED":
      return "No longer available";
    case "SIGNIFICANT_CHANGE":
      return typeof p.field === "string" ? `${p.field} changed` : "Listing details changed";
    case "GOOD_DEAL":
      return typeof p.percentBelowMarket === "number" ? `Priced ${p.percentBelowMarket}% below comparable listings` : "Good deal detected";
    default:
      return "";
  }
}

export function AlertEventRow({ event }: { event: AlertEventData }) {
  const meta = TYPE_META[event.type] ?? { icon: Bell, label: event.type };
  const Icon = meta.icon;
  const title = event.listing ? `${event.listing.vehicle.manufacturer} ${event.listing.vehicle.model}` : meta.label;

  const content = (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong">
      {event.listing ? (
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md">
          <VehicleImage src={event.listing.images[0]} alt={title} manufacturer={event.listing.vehicle.manufacturer} className="h-full w-full" />
        </div>
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{meta.label}</Badge>
          <p className="truncate text-sm font-medium text-fg">{title}</p>
        </div>
        <p className="truncate text-xs text-fg-muted">{describeEvent(event)}</p>
      </div>
      <div className="shrink-0 text-right text-[11px] text-fg-subtle">
        <p>{event.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
        {event.status === "FAILED" && <p className="text-danger">Delivery failed</p>}
      </div>
    </div>
  );

  return event.listing ? <Link href={`/listings/${event.listing.id}`}>{content}</Link> : content;
}
