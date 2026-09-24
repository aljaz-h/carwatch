import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ParserStructureError } from "../src/errors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures", "avto-net");

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf-8");
}

// AvtoNetProvider fetches via a real headless browser (see ../src/http/browser-fetch.ts)
// rather than plain HTTP, so these tests mock that module instead of global fetch —
// no Chromium install needed to run them.
const { fetchTextViaBrowser } = vi.hoisted(() => ({ fetchTextViaBrowser: vi.fn() }));

vi.mock("../src/http/browser-fetch.js", () => ({
  fetchTextViaBrowser,
  closeBrowser: vi.fn(),
}));

const { AvtoNetProvider } = await import("../src/providers/avto-net/index.js");

describe("AvtoNetProvider.searchListings parser-health guard", () => {
  afterEach(() => {
    fetchTextViaBrowser.mockReset();
  });

  it("throws ParserStructureError when page 1 lacks the expected results container", async () => {
    fetchTextViaBrowser.mockResolvedValue(loadFixture("search-page-changed-markup.html"));

    const provider = new AvtoNetProvider({ minDelayMs: 0, jitterMs: 0 });
    const iterate = async () => {
      for await (const _item of provider.searchListings({ maxPages: 1 })) {
        // no-op
      }
    };

    await expect(iterate()).rejects.toThrow(ParserStructureError);
  });

  it("does not throw for a page that legitimately has zero results", async () => {
    fetchTextViaBrowser.mockResolvedValue(loadFixture("search-page-empty.html"));

    const provider = new AvtoNetProvider({ minDelayMs: 0, jitterMs: 0 });
    const items: unknown[] = [];
    for await (const item of provider.searchListings({ maxPages: 1 })) {
      items.push(item);
    }
    expect(items).toHaveLength(0);
  });
});
