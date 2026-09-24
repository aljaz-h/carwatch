"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProviderCard, type ProviderDiagnostic } from "./provider-card";

const POLL_INTERVAL_MS = 7000;

export function ProvidersPanel({ initial }: { initial: ProviderDiagnostic[] }) {
  const [providers, setProviders] = useState(initial);
  const inFlightFetch = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightFetch.current) return;
    inFlightFetch.current = true;
    try {
      const res = await fetch("/api/providers/diagnostics");
      if (res.ok) {
        const body = await res.json();
        setProviders(body.providers);
      }
    } catch {
      // A missed poll tick just means slightly stale data until the next one — not worth surfacing.
    } finally {
      inFlightFetch.current = false;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="flex flex-col gap-3">
      {providers.map((p) => (
        <ProviderCard key={p.id} provider={p} onRefreshNow={refresh} />
      ))}
    </div>
  );
}
