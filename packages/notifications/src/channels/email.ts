import type { Transporter } from "nodemailer";
import type { EmailChannelConfig, NotificationChannel, NotificationPayload, NotificationSendResult } from "../types";

export interface EmailSender {
  sendMail(options: { to: string; from: string; subject: string; text: string; html: string }): Promise<unknown>;
}

function renderHtml(payload: NotificationPayload): string {
  const fieldsHtml = payload.fields
    ?.map((f) => `<tr><td style="padding:4px 12px 4px 0;color:#8a8d91;">${f.label}</td><td style="padding:4px 0;color:#e8e9eb;">${f.value}</td></tr>`)
    .join("");

  return `
  <div style="background:#111214;padding:32px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#1a1b1e;border:1px solid #2a2b2f;border-radius:12px;overflow:hidden;">
      ${payload.imageUrl ? `<img src="${payload.imageUrl}" style="width:100%;height:220px;object-fit:cover;" />` : ""}
      <div style="padding:24px;">
        <h1 style="color:#f2f3f4;font-size:18px;margin:0 0 8px;">${payload.title}</h1>
        <p style="color:#b5b7bb;font-size:14px;line-height:1.5;margin:0 0 16px;">${payload.body}</p>
        ${fieldsHtml ? `<table style="font-size:13px;border-collapse:collapse;">${fieldsHtml}</table>` : ""}
        ${payload.url ? `<a href="${payload.url}" style="display:inline-block;margin-top:16px;background:#4f7cff;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;">View on CarWatch</a>` : ""}
      </div>
    </div>
  </div>`;
}

export class EmailChannel implements NotificationChannel {
  readonly type = "EMAIL" as const;

  constructor(
    private readonly config: EmailChannelConfig,
    private readonly transporter: EmailSender | Transporter,
    private readonly fromAddress: string,
  ) {}

  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    if (!this.config.to) {
      return { ok: false, error: "Missing recipient email address" };
    }
    try {
      await this.transporter.sendMail({
        to: this.config.to,
        from: this.fromAddress,
        subject: payload.title,
        text: `${payload.body}${payload.url ? `\n\n${payload.url}` : ""}`,
        html: renderHtml(payload),
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
