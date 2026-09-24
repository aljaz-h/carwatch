import type { AlertChannelType, AlertType } from "@carwatch/shared";

export interface NotificationField {
  label: string;
  value: string;
}

/** Channel-agnostic content for one alert. Each channel renders this however suits its medium. */
export interface NotificationPayload {
  type: AlertType;
  title: string;
  body: string;
  url?: string;
  imageUrl?: string;
  fields?: NotificationField[];
}

export interface NotificationSendResult {
  ok: boolean;
  error?: string;
}

/**
 * Common contract for delivering an alert over some medium. New channels
 * (Telegram, web push, ntfy, Gotify, ...) implement this interface and
 * register in `ChannelRegistry` — nothing else in the app needs to change.
 */
export interface NotificationChannel {
  readonly type: AlertChannelType;
  send(payload: NotificationPayload): Promise<NotificationSendResult>;
}

/** Per-user channel configuration as stored in NotificationChannel.config (Json). */
export interface DiscordChannelConfig {
  webhookUrl: string;
}

export interface EmailChannelConfig {
  to: string;
}
