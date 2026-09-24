import { createHash } from "node:crypto";
import type { AlertType } from "../types/enums";

/**
 * Builds a stable dedupe key for an AlertEvent so the same underlying event
 * (e.g. "listing X dropped to price Y") is never delivered twice. Callers
 * should include any value that legitimately makes the event "new" again
 * (e.g. the new price for a price-drop alert) in `discriminator`.
 */
export function buildAlertDedupeKey(params: {
  userId: string;
  type: AlertType;
  listingId?: string;
  savedSearchId?: string;
  discriminator?: string | number;
}): string {
  const raw = [params.userId, params.type, params.listingId ?? "", params.savedSearchId ?? "", params.discriminator ?? ""].join(
    "::",
  );
  return createHash("sha256").update(raw).digest("hex");
}
