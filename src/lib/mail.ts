/**
 * Mail transport for password-reset and email-verification links.
 *
 * Supports two providers (tried in order):
 *   1. Resend — when RESEND_API_KEY is set, uses the official endpoint.
 *   2. Generic Resend-style JSON API — when MAIL_API_URL + MAIL_API_KEY are set.
 *
 * When no transport is configured it logs the message and returns not-delivered
 * so callers can surface the one-time link directly in the UI (demo mode) — the
 * project never loses the ability to verify/reset, regardless of SMTP.
 *
 * The from-name uses the site-config league name so rebranding any city is
 * reflected in emails too.
 */

import { getSiteConfig } from "@/lib/data/site-config";

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const MAIL_API_URL = process.env.MAIL_API_URL || "";
const MAIL_API_KEY = process.env.MAIL_API_KEY || "";
const MAIL_FROM_RAW = process.env.MAIL_FROM || "";

export type MailResult = { delivered: boolean };

async function fromName(): Promise<string> {
  try {
    const cfg = await getSiteConfig();
    return cfg.leagueName || "ASL Platform";
  } catch {
    return "ASL Platform";
  }
}

export async function sendMail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<MailResult> {
  const name = await fromName();
  const from =
    MAIL_FROM_RAW ||
    (RESEND_API_KEY
      ? `${name} <onboarding@resend.dev>`
      : `${name} <no-reply@asl-platform.local>`);

  const body = {
    from,
    to: [params.to],
    subject: params.subject,
    text: params.text,
    html: params.html ?? params.text,
  };

  // 1. Resend (official SDK-style HTTP API)
  if (RESEND_API_KEY) {
    try {
      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
      return { delivered: true };
    } catch (error) {
      console.error("[mail] resend failed, trying generic API:", error);
    }
  }

  // 2. Generic Resend-style JSON API
  if (MAIL_API_URL && MAIL_API_KEY) {
    try {
      const res = await fetch(MAIL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MAIL_API_KEY}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`mail api ${res.status}`);
      return { delivered: true };
    } catch (error) {
      console.error("[mail] delivery failed, falling back to console:", error);
    }
  }

  // Demo/dev fallback — logs the full message server-side.
  console.info(`[mail:noop] to=${params.to}\nsubject=${params.subject}\n${params.text}`);
  return { delivered: false };
}
