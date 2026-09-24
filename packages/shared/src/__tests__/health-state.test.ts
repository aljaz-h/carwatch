import { describe, expect, it } from "vitest";
import { deriveProviderHealthState } from "../provider-diagnostics/health-state.js";

describe("deriveProviderHealthState", () => {
  it("is DISABLED when the provider is off, regardless of run history", () => {
    expect(
      deriveProviderHealthState({ isEnabled: false, hasEverRun: true, latestRunStatus: "SUCCESS", consecutiveFailures: 0 }),
    ).toBe("DISABLED");
  });

  it("is NEVER_RUN for an enabled provider with no runs yet", () => {
    expect(deriveProviderHealthState({ isEnabled: true, hasEverRun: false, consecutiveFailures: 0 })).toBe("NEVER_RUN");
  });

  it("is ERROR after consecutive failures", () => {
    expect(
      deriveProviderHealthState({ isEnabled: true, hasEverRun: true, latestRunStatus: "FAILED", consecutiveFailures: 3 }),
    ).toBe("ERROR");
  });

  it("is WARNING for a partial/suspicious run even without hard failures", () => {
    expect(
      deriveProviderHealthState({ isEnabled: true, hasEverRun: true, latestRunStatus: "PARTIAL", consecutiveFailures: 0 }),
    ).toBe("WARNING");
    expect(
      deriveProviderHealthState({
        isEnabled: true,
        hasEverRun: true,
        latestRunStatus: "SUCCESS",
        latestRunIsSuspicious: true,
        consecutiveFailures: 0,
      }),
    ).toBe("WARNING");
  });

  it("is HEALTHY for a clean successful run", () => {
    expect(
      deriveProviderHealthState({ isEnabled: true, hasEverRun: true, latestRunStatus: "SUCCESS", consecutiveFailures: 0 }),
    ).toBe("HEALTHY");
  });
});
