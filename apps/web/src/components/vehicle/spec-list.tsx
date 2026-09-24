export function SpecList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] uppercase tracking-wide text-fg-subtle">{item.label}</dt>
          <dd className="mt-0.5 text-sm text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
