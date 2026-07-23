const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@school-intelligence.local";

/**
 * Sends an email via Resend if RESEND_API_KEY is configured. Otherwise, in
 * non-production environments, logs it to the server console so the flow
 * that depends on it (e.g. password reset) can still be exercised locally.
 * Never logs to any persisted, admin-browsable store (e.g. AuditLog) --
 * only the server process's own stdout, which is the same dev-only
 * disclosure pattern NextAuth's own Email provider uses.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  if (RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) {
      throw new Error(`Email provider returned ${res.status}`);
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[email:dev-mode, no RESEND_API_KEY set] To: ${params.to} | Subject: ${params.subject}\n${params.html}`);
    return;
  }

  throw new Error("No email provider configured (set RESEND_API_KEY).");
}
