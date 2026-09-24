import { describe, expect, it } from "vitest";
import { classifyProviderError } from "../provider-diagnostics/classify-error.js";

describe("classifyProviderError", () => {
  it("classifies HTTP 403 as forbidden with a friendly message", () => {
    const result = classifyProviderError({ status: 403, name: "HttpError", message: "Retryable HTTP 403" }, { providerName: "Avto.net" });
    expect(result.errorType).toBe("HTTP_FORBIDDEN");
    expect(result.httpStatus).toBe(403);
    expect(result.userMessage).toContain("Avto.net");
    expect(result.userMessage).not.toMatch(/at Object|node_modules/);
  });

  it("classifies HTTP 429 as rate limited", () => {
    const result = classifyProviderError({ status: 429, name: "HttpError" });
    expect(result.errorType).toBe("HTTP_RATE_LIMITED");
    expect(result.httpStatus).toBe(429);
  });

  it("classifies a ParserStructureError as a structure mismatch", () => {
    const err = Object.assign(new Error("selector .GO-Results-Row not found"), { name: "ParserStructureError" });
    const result = classifyProviderError(err, { providerName: "Avto.net" });
    expect(result.errorType).toBe("PARSER_STRUCTURE_MISMATCH");
    expect(result.technicalDetail).toContain("ParserStructureError");
  });

  it("classifies AbortError as a request timeout", () => {
    const err = Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
    expect(classifyProviderError(err).errorType).toBe("REQUEST_TIMEOUT");
  });

  it("classifies DNS failures via error.cause.code", () => {
    const cause = Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" });
    const err = new Error("fetch failed", { cause });
    expect(classifyProviderError(err).errorType).toBe("DNS_FAILURE");
  });

  it("classifies connection resets/timeouts", () => {
    const cause = Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" });
    const err = new Error("fetch failed", { cause });
    expect(classifyProviderError(err).errorType).toBe("CONNECTION_TIMEOUT");
  });

  it("classifies Prisma-shaped errors as database errors", () => {
    const err = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    expect(classifyProviderError(err).errorType).toBe("DATABASE_ERROR");
  });

  it("uses the phase hint to disambiguate a generic error", () => {
    const err = new Error("boom");
    expect(classifyProviderError(err, { phase: "persist" }).errorType).toBe("DATABASE_ERROR");
    expect(classifyProviderError(err, { phase: "normalize" }).errorType).toBe("NORMALIZATION_ERROR");
    expect(classifyProviderError(err).errorType).toBe("INTERNAL_ERROR");
  });

  it("never includes a stack trace in the technical detail", () => {
    const err = new Error("boom");
    const result = classifyProviderError(err);
    expect(result.technicalDetail).not.toContain("at ");
    expect(result.technicalDetail.length).toBeLessThanOrEqual(500);
  });
});
