import type { ProviderErrorType } from "../types/enums.js";

export interface ClassifiedError {
  errorType: ProviderErrorType;
  httpStatus?: number;
  /** Shown by default — plain language, no jargon. */
  userMessage: string;
  /** Shown only behind an "advanced" toggle — short, never a full stack trace. */
  technicalDetail: string;
}

export type ScrapePhase = "search" | "detail" | "normalize" | "persist";

function technicalDetailOf(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as { cause?: unknown }).cause;
    const causeText = cause instanceof Error ? ` (cause: ${cause.message})` : cause ? ` (cause: ${String(cause)})` : "";
    return `${err.name}: ${err.message}${causeText}`.slice(0, 500);
  }
  return String(err).slice(0, 500);
}

/**
 * Turns whatever a provider call threw into a stable, user-presentable
 * classification. Duck-types rather than importing concrete error classes
 * from `@carwatch/providers` or `@carwatch/database` so this stays a
 * dependency-free, easily unit-testable module.
 */
export function classifyProviderError(
  err: unknown,
  context: { phase?: ScrapePhase; providerName?: string } = {},
): ClassifiedError {
  const providerName = context.providerName ?? "The provider";
  const technicalDetail = technicalDetailOf(err);
  const asRecord = err as Record<string, unknown> | null | undefined;

  const status = typeof asRecord?.status === "number" ? (asRecord.status as number) : undefined;
  if (status !== undefined) {
    if (status === 403) {
      return {
        errorType: "HTTP_FORBIDDEN",
        httpStatus: status,
        userMessage: `${providerName} refused this request (HTTP 403). It may be blocking automated requests, or its anti-bot protection changed.`,
        technicalDetail,
      };
    }
    if (status === 429) {
      return {
        errorType: "HTTP_RATE_LIMITED",
        httpStatus: status,
        userMessage: `${providerName} is rate-limiting CarWatch (HTTP 429). The worker will retry automatically using exponential backoff.`,
        technicalDetail,
      };
    }
    return {
      errorType: "HTTP_ERROR",
      httpStatus: status,
      userMessage: `${providerName} returned an unexpected response (HTTP ${status}).`,
      technicalDetail,
    };
  }

  const name = typeof asRecord?.name === "string" ? asRecord.name : undefined;
  if (name === "ParserStructureError") {
    return {
      errorType: "PARSER_STRUCTURE_MISMATCH",
      userMessage: `${providerName}'s response could not be parsed. CarWatch expected a specific page structure and it was not found — the marketplace may have changed its HTML.`,
      technicalDetail,
    };
  }
  if (name === "AbortError") {
    return {
      errorType: "REQUEST_TIMEOUT",
      userMessage: `${providerName} did not respond in time.`,
      technicalDetail,
    };
  }

  const cause = asRecord?.cause as Record<string, unknown> | undefined;
  const code = (cause?.code as string | undefined) ?? (asRecord?.code as string | undefined);
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return {
      errorType: "DNS_FAILURE",
      userMessage: `Could not resolve ${providerName}'s address. This is usually a temporary DNS or network issue.`,
      technicalDetail,
    };
  }
  if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT") {
    return {
      errorType: "CONNECTION_TIMEOUT",
      userMessage: `Could not connect to ${providerName}.`,
      technicalDetail,
    };
  }

  // Prisma known-request errors carry a "P####" code.
  if (typeof code === "string" && /^P\d{4}$/.test(code)) {
    return {
      errorType: "DATABASE_ERROR",
      userMessage: "CarWatch could not save the scraped listings due to a database error.",
      technicalDetail,
    };
  }

  if (context.phase === "persist") {
    return {
      errorType: "DATABASE_ERROR",
      userMessage: "CarWatch could not save the scraped listings due to a database error.",
      technicalDetail,
    };
  }
  if (context.phase === "normalize") {
    return {
      errorType: "NORMALIZATION_ERROR",
      userMessage: `${providerName} returned data CarWatch could not interpret correctly.`,
      technicalDetail,
    };
  }

  return {
    errorType: "INTERNAL_ERROR",
    userMessage: "An unexpected error occurred while scraping this provider.",
    technicalDetail,
  };
}

/** User-friendly label for an error type, used in history rows / filters. */
export const PROVIDER_ERROR_TYPE_LABELS: Record<ProviderErrorType, string> = {
  DNS_FAILURE: "DNS failure",
  CONNECTION_TIMEOUT: "Connection timeout",
  REQUEST_TIMEOUT: "Request timeout",
  HTTP_FORBIDDEN: "HTTP 403 Forbidden",
  HTTP_RATE_LIMITED: "HTTP 429 Rate limited",
  HTTP_ERROR: "HTTP error",
  PARSER_STRUCTURE_MISMATCH: "Page structure changed",
  PARSER_ANOMALY: "Unexpected result count",
  UNEXPECTED_RESPONSE: "Unexpected response",
  DATABASE_ERROR: "Database error",
  NORMALIZATION_ERROR: "Normalization error",
  INTERNAL_ERROR: "Internal error",
};
