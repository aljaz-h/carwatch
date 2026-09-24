import { describe, expect, it } from "vitest";
import { buildAlertDedupeKey } from "../alerts/dedupe";

describe("buildAlertDedupeKey", () => {
  it("is stable for identical inputs", () => {
    const a = buildAlertDedupeKey({ userId: "u1", type: "NEW_MATCH", listingId: "l1", savedSearchId: "s1" });
    const b = buildAlertDedupeKey({ userId: "u1", type: "NEW_MATCH", listingId: "l1", savedSearchId: "s1" });
    expect(a).toBe(b);
  });

  it("differs when the discriminator changes (e.g. a further price drop)", () => {
    const drop1 = buildAlertDedupeKey({ userId: "u1", type: "PRICE_DROP", listingId: "l1", discriminator: 11900 });
    const drop2 = buildAlertDedupeKey({ userId: "u1", type: "PRICE_DROP", listingId: "l1", discriminator: 11500 });
    expect(drop1).not.toBe(drop2);
  });

  it("differs across users, types, and listings so alerts never collide", () => {
    const base = buildAlertDedupeKey({ userId: "u1", type: "NEW_MATCH", listingId: "l1" });
    expect(buildAlertDedupeKey({ userId: "u2", type: "NEW_MATCH", listingId: "l1" })).not.toBe(base);
    expect(buildAlertDedupeKey({ userId: "u1", type: "PRICE_DROP", listingId: "l1" })).not.toBe(base);
    expect(buildAlertDedupeKey({ userId: "u1", type: "NEW_MATCH", listingId: "l2" })).not.toBe(base);
  });
});
