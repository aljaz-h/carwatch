import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscordWebhookChannel } from "../src/channels/discord.js";

describe("DiscordWebhookChannel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts an embed to the webhook URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const channel = new DiscordWebhookChannel({ webhookUrl: "https://discord.example/webhook" });
    const result = await channel.send({
      type: "PRICE_DROP",
      title: "Price drop: Golf",
      body: "Now cheaper",
      url: "https://example.com/listing/1",
      fields: [{ label: "New price", value: "€11,900" }],
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://discord.example/webhook",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.embeds[0].title).toBe("Price drop: Golf");
  });

  it("returns a failure result without throwing when the webhook errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const channel = new DiscordWebhookChannel({ webhookUrl: "https://discord.example/webhook" });
    const result = await channel.send({ type: "NEW_MATCH", title: "t", body: "b" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("404");
  });

  it("fails fast when no webhook URL is configured", async () => {
    const channel = new DiscordWebhookChannel({ webhookUrl: "" });
    const result = await channel.send({ type: "NEW_MATCH", title: "t", body: "b" });
    expect(result.ok).toBe(false);
  });
});
