import { formatMileage, formatPrice } from "@carwatch/shared";

interface TimelineEvent {
  date: Date;
  label: string;
}

export function ListingTimeline({
  priceHistory,
  statusHistory,
  mileageHistory,
  firstSeenAt,
}: {
  priceHistory: { price: number; recordedAt: Date }[];
  statusHistory: { status: string; recordedAt: Date }[];
  mileageHistory: { mileage: number; recordedAt: Date }[];
  firstSeenAt: Date;
}) {
  const events: TimelineEvent[] = [];

  events.push({ date: firstSeenAt, label: "Listing discovered" });

  priceHistory.forEach((p, i) => {
    if (i === 0) return;
    const prev = priceHistory[i - 1]!;
    const delta = p.price - prev.price;
    events.push({
      date: p.recordedAt,
      label: delta < 0 ? `Price reduced to ${formatPrice(p.price)} (${formatPrice(delta)})` : `Price increased to ${formatPrice(p.price)} (+${formatPrice(delta)})`,
    });
  });

  statusHistory.forEach((s, i) => {
    if (i === 0) return;
    events.push({
      date: s.recordedAt,
      label:
        s.status === "ACTIVE"
          ? "Listing returned — available again"
          : s.status === "INACTIVE"
            ? "Listing became unavailable"
            : s.status === "SOLD"
              ? "Marked as sold"
              : `Status changed to ${s.status.toLowerCase()}`,
    });
  });

  mileageHistory.forEach((m, i) => {
    if (i === 0) return;
    events.push({ date: m.recordedAt, label: `Mileage updated to ${formatMileage(m.mileage)}` });
  });

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <ol className="flex flex-col gap-4">
      {events.map((e, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {i < events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
          </div>
          <div className="pb-1">
            <p className="text-sm text-fg">{e.label}</p>
            <p className="text-xs text-fg-subtle">{e.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
