import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvtoNetProvider } from "../src/providers/avto-net/index.js";
import { ParserStructureError } from "../src/errors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures", "avto-net");

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf-8");
}

describe("AvtoNetProvider.searchListings parser-health guard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws ParserStructureError when page 1 lacks the expected results container", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(loadFixture("search-page-changed-markup.html")) }),
    );

    const provider = new AvtoNetProvider({ minDelayMs: 0, jitterMs: 0 });
    const iterate = async () => {
      for await (const _item of provider.searchListings({ maxPages: 1 })) {
        // no-op
      }
    };

    await expect(iterate()).rejects.toThrow(ParserStructureError);
  });

  it("does not throw for a page that legitimately has zero results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(loadFixture("search-page-empty.html")) }));

    const provider = new AvtoNetProvider({ minDelayMs: 0, jitterMs: 0 });
    const items: unknown[] = [];
    for await (const item of provider.searchListings({ maxPages: 1 })) {
      items.push(item);
    }
    expect(items).toHaveLength(0);
  });
});
