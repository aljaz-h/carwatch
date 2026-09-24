import type { Transporter } from "nodemailer";
import { DiscordWebhookChannel } from "./channels/discord";
import { EmailChannel } from "./channels/email";
import type { DiscordChannelConfig, EmailChannelConfig, NotificationChannel } from "./types";

/**
 * Builds a NotificationChannel instance from a stored channel row's type +
 * config JSON. Adding Telegram/ntfy/Gotify/web push later means adding a
 * `case` here and a new class under `channels/` — nothing else changes.
 */
export function buildChannel(
  channel: { type: string; config: unknown },
  deps: { mailer: { transporter: Transporter; fromAddress: string } },
): NotificationChannel {
  switch (channel.type) {
    case "DISCORD":
      return new DiscordWebhookChannel(channel.config as DiscordChannelConfig);
    case "EMAIL":
      return new EmailChannel(channel.config as EmailChannelConfig, deps.mailer.transporter, deps.mailer.fromAddress);
    default:
      throw new Error(`Unsupported notification channel type: ${channel.type}`);
  }
}
