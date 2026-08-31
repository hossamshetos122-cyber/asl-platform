/**
 * Minimal mail transport used for password-reset and email-verification links.
 *
 * When MAIL_API_URL + MAIL_API_KEY are configured (Resend-style JSON API),
 * sends via HTTP. Otherwise it logs the message and returns not-delivered so
 * callers can surface the one-time link directly in the UI (demo mode) —
 * the project never loses the ability to verify/reset, regardless of SMTP.
 */

const MAIL_API_URL = process.env.MAIL_API_URL || "";
const MAIL_API_KEY = process.env.MAIL_API_KEY || "";
const MAIL_FROM = process.env.MAIL_FROM || "ASL Platform <no-reply@asl-platform.local>";

export type MailResult = { delivered: boolean };

export async function sendMail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<MailResult> {
  if (MAIL_API_URL && MAIL_API_KEY) {
    try {
      const res = await fetch(MAIL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MAIL_API_KEY}`,
        },
        body: JSON.stringify({
          from: MAIL_FROM,
          to: [params.to],
          subject: params.subject,
          text: params.text,
          html: params.html ?? params.text,
        }),
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