import nodemailer from "nodemailer";

export interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  fromAddress: string;
}

export function createMailerFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const host = env.SMTP_HOST;
  if (!host) return null;

  const config: MailerConfig = {
    host,
    port: env.SMTP_PORT ? Number.parseInt(env.SMTP_PORT, 10) : 587,
    secure: env.SMTP_SECURE === "true",
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
    fromAddress: env.SMTP_FROM ?? "CarWatch <no-reply@carwatch.local>",
  };

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
  });

  return { transporter, fromAddress: config.fromAddress };
}
