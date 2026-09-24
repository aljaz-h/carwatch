/**
 * Thrown by a provider when a page returns successfully (HTTP 200) but is
 * missing the container/selector its parser depends on entirely — a strong,
 * specific signal that the marketplace changed its HTML, as opposed to a
 * search that legitimately matched zero listings (where the container is
 * still present, just empty). `classifyProviderError` in `@carwatch/shared`
 * recognizes this by name (`err.name === "ParserStructureError"`) without a
 * hard dependency on this class.
 */
export class ParserStructureError extends Error {
  constructor(
    message: string,
    public readonly selector: string,
    public readonly url: string,
  ) {
    super(message);
    this.name = "ParserStructureError";
  }
}
