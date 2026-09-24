import type { ProviderHealthState, ScrapeRunStatus } from "../types/enums.js";

export interface ProviderHealthInput {
  isEnabled: boolean;
  hasEverRun: boolean;
  latestRunStatus?: ScrapeRunStatus;
  latestRunIsSuspicious?: boolean;
  consecutiveFailures: number;
}

/**
 * A provider's health state is derived, never stored directly — it's a
 * function of whether it's enabled, whether it has ever run, and how its
 * most recent run(s) went. Disabled always wins (an admin turned it off on
 * purpose, that's not an error state).
 */
export function deriveProviderHealthState(input: ProviderHealthInput): ProviderHealthState {
  if (!input.isEnabled) return "DISABLED";
  if (!input.hasEverRun) return "NEVER_RUN";
  if (input.consecutiveFailures > 0 || input.latestRunStatus === "FAILED") return "ERROR";
  if (input.latestRunStatus === "PARTIAL" || input.latestRunIsSuspicious) return "WARNING";
  return "HEALTHY";
}

export const PROVIDER_HEALTH_LABELS: Record<ProviderHealthState, string> = {
  HEALTHY: "Healthy",
  WARNING: "Warning",
  ERROR: "Error",
  DISABLED: "Disabled",
  NEVER_RUN: "Never run",
};
