import "server-only";

/** Optional email to staff via Resend. Silently skipped when not configured. */
export async function notifyStaff(subject: string, lines: string[]) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_EMAIL_FROM;
  const to = process.env.NOTIFICATION_EMAIL_TO;
  if (!key || !from || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()),
        subject,
        text: `${lines.join("\n")}\n\n— Amrai Pari website`,
      }),
    });
  } catch (e) {
    console.error("[notify]", e);
  }
}
