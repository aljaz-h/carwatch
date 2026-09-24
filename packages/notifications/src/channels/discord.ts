import type { DiscordChannelConfig, NotificationChannel, NotificationPayload, NotificationSendResult } from "../types";

const ALERT_COLORS: Record<string, number> = {
  NEW_MATCH: 0x4f7cff,
  PRICE_DROP: 0x3ecf8e,
  PRICE_INCREASE: 0xe0a94c,
  LISTING_RETURNED: 0x9b7cff,
  LISTING_REMOVED: 0x8a8d91,
  SIGNIFICANT_CHANGE: 0xe0a94c,
  GOOD_DEAL: 0x3ecf8e,
};

export class DiscordWebhookChannel implements NotificationChannel {
  readonly type = "DISCORD" as const;

  constructor(private readonly config: DiscordChannelConfig) {}

  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    if (!this.config.webhookUrl) {
      return { ok: false, error: "Missing Discord webhook URL" };
    }

    const embed = {
      title: payload.title,
      description: payload.body,
      url: payload.url,
      color: ALERT_COLORS[payload.type] ?? 0x4f7cff,
      image: payload.imageUrl ? { url: payload.imageUrl } : undefined,
      fields: payload.fields?.map((f) => ({ name: f.label, value: f.value, inline: true })),
      footer: { text: "CarWatch" },
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      });
      if (!response.ok) {
        return { ok: false, error: `Discord webhook responded ${response.status}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
