import "server-only";
import { getConfig } from "@/server/config";
import { logger } from "@/server/logger";

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { success: true; id: string }
  | { success: false; reason: string };

/**
 * Core transactional email sender using the Resend REST API (§23).
 * Works identically across Node.js runtime and edge/Cloudflare workers without external SDK bloat.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = getConfig();
  const apiKey = config.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn("email.skipped_no_api_key", { to: options.to, subject: options.subject });
    return { success: false, reason: "RESEND_API_KEY_NOT_CONFIGURED" };
  }

  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const from = options.from ?? config.TRANSACTIONAL_EMAIL_FROM ?? "ReachBee <team@sayalabs.in>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.error("email.send_failed", { status: res.status, error: errorText });
      return { success: false, reason: `RESEND_ERROR_${res.status}: ${errorText.slice(0, 200)}` };
    }

    const data = (await res.json()) as { id: string };
    logger.info("email.sent", { id: data.id, to: recipients, subject: options.subject });
    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("email.network_error", { error: message });
    return { success: false, reason: message };
  }
}

/* ------------------------------------------------------------------ */
/* Branded Transactional Templates                                    */
/* ------------------------------------------------------------------ */

/**
 * Support and privacy templates interpolate free-text supplied by an
 * unauthenticated visitor. Without escaping, a crafted message injects
 * arbitrary HTML (and links) into the operator's inbox.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getAppBaseUrl(): string {
  try {
    const config = getConfig();
    if (config.APP_BASE_URL) {
      return config.APP_BASE_URL.replace(/\/+$/, "");
    }
  } catch {
    // fallback if config isn't initialized yet
  }
  return "https://reachbee.sayalabs.in";
}

function getAppDisplayDomain(baseUrl: string): string {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return "reachbee.sayalabs.in";
  }
}

function emailWrapper(content: string): string {
  const baseUrl = getAppBaseUrl();
  const domain = getAppDisplayDomain(baseUrl);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; color: #1f1e1a; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e5dc; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .header { margin-bottom: 24px; border-bottom: 1px solid #f0eee6; padding-bottom: 16px; }
    .logo { font-size: 20px; font-weight: 800; color: #1f1e1a; text-decoration: none; }
    .logo span { color: #f59e0b; }
    .footer { margin-top: 32px; font-size: 12px; color: #78756c; text-align: center; line-height: 1.5; }
    .button { display: inline-block; background-color: #1f1e1a; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 16px; }
    .meta-box { background: #faf9f5; border: 1px solid #eae7dd; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; }
    .tag { display: inline-block; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <a href="${baseUrl}" class="logo">ReachBee <span>AI</span></a>
    </div>
    ${content}
    <div class="footer">
      <p>ReachBee AI by SayaLabs Studio • ${domain}<br/>Autonomous Career Outreach & Decision-Maker Intelligence</p>
    </div>
  </div>
</body>
</html>
`;
}

/** 1. Welcome & Free Trial Confirmation */
export async function sendWelcomeEmail(email: string, displayName?: string | null): Promise<SendEmailResult> {
  const baseUrl = getAppBaseUrl();
  const name = displayName?.trim() || "there";
  const html = emailWrapper(`
    <h2 style="margin-top: 0; font-size: 22px;">Welcome to ReachBee, ${name}!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #403e38;">
      Your workspace is ready. You now have access to verified technical hiring managers, founders, and engineering leads.
    </p>
    <div class="meta-box">
      <div style="font-weight: 700; margin-bottom: 8px;">Your Free Starter Credits:</div>
      <ul style="margin: 0; padding-left: 20px; color: #403e38;">
        <li><strong>5 Contact Reveals</strong> — Unlock direct verified work emails</li>
        <li><strong>2 AI Resume Drafts</strong> — 1-click tailored pitches staged in your Gmail Drafts</li>
      </ul>
    </div>
    <p style="font-size: 14px; color: #403e38;">
      Upload your resume PDF in the workspace, browse contacts in your target roles, and let the AI draft your introduction before anything leaves your hands.
    </p>
    <a href="${baseUrl}/app" class="button">Go to Workspace &rarr;</a>
  `);

  return sendEmail({
    to: email,
    subject: "Welcome to ReachBee AI — Your 5 Free Credits are Ready",
    html,
    text: `Welcome to ReachBee! Your workspace is ready with 5 free contact reveals and 2 AI drafts. Visit ${baseUrl}/app to get started.`,
  });
}

/** 2. Support Ticket Confirmation & Admin Notification */
export async function sendSupportTicketNotification(params: {
  userEmail: string;
  publicRef: string;
  category: string;
  message: string;
}): Promise<void> {
  // Confirm to User
  const userHtml = emailWrapper(`
    <h2 style="margin-top: 0; font-size: 20px;">Support Request Received</h2>
    <p style="font-size: 14px; color: #403e38;">We received your message and our team will get back to you shortly.</p>
    <div class="meta-box">
      <p style="margin: 0 0 8px;"><strong>Reference:</strong> <span class="tag">${escapeHtml(params.publicRef)}</span></p>
      <p style="margin: 0 0 8px;"><strong>Category:</strong> ${escapeHtml(params.category)}</p>
      <p style="margin: 0;"><strong>Message:</strong></p>
      <p style="margin: 4px 0 0; color: #555; white-space: pre-wrap;">${escapeHtml(params.message)}</p>
    </div>
    <p style="font-size: 13px; color: #78756c;">Save your reference code for faster follow-up.</p>
  `);

  await sendEmail({
    to: params.userEmail,
    subject: `[ReachBee Support] Request ${params.publicRef} received`,
    html: userHtml,
  });

  // Alert Team
  const adminHtml = emailWrapper(`
    <h2 style="margin-top: 0; font-size: 18px; color: #b45309;">New Support Ticket (${escapeHtml(params.publicRef)})</h2>
    <div class="meta-box">
      <p><strong>From:</strong> ${escapeHtml(params.userEmail)}</p>
      <p><strong>Category:</strong> ${escapeHtml(params.category)}</p>
      <p><strong>Message:</strong></p>
      <div style="background: #fff; padding: 12px; border: 1px solid #ddd; border-radius: 6px; white-space: pre-wrap;">${escapeHtml(params.message)}</div>
    </div>
  `);

  await sendEmail({
    to: "anurag@sayalabs.in",
    subject: `🚨 [Support] ${params.publicRef}: ${params.category} from ${params.userEmail}`,
    html: adminHtml,
  });
}

/** 3. Contact Data Removal Request Confirmation */
export async function sendContactDataRequestNotification(params: {
  email: string;
  requestType: "removal" | "correction";
  details: string;
}): Promise<void> {
  const userHtml = emailWrapper(`
    <h2 style="margin-top: 0; font-size: 20px;">Directory Data Request Received</h2>
    <p style="font-size: 14px; color: #403e38;">
      We have logged your request to <strong>${params.requestType === "removal" ? "remove" : "correct"}</strong> your contact information from the ReachBee directory.
    </p>
    <div class="meta-box">
      <p style="margin: 0;"><strong>Subject Email:</strong> ${escapeHtml(params.email)}</p>
      <p style="margin: 8px 0 0;"><strong>Details:</strong> ${escapeHtml(params.details)}</p>
    </div>
    <p style="font-size: 13px; color: #403e38;">
      Our governance process honors suppression requests within 48 hours without requiring an account.
    </p>
  `);

  await sendEmail({
    to: params.email,
    subject: `[ReachBee Privacy] We received your directory request`,
    html: userHtml,
  });

  // Admin alert
  await sendEmail({
    to: "anurag@sayalabs.in",
    subject: `🛡️ [Privacy Request] ${params.requestType.toUpperCase()} for ${params.email}`,
    html: emailWrapper(`
      <h3>Directory Data Request (${params.requestType})</h3>
      <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
      <p><strong>Details:</strong> ${escapeHtml(params.details)}</p>
    `),
  });
}

/** 4. Payment Receipt & Credit Pack Grant */
export async function sendPaymentReceiptEmail(params: {
  userEmail: string;
  orderId: string;
  skuName: string;
  amountPaise: number;
  contactCredits: number;
  aiCredits: number;
}): Promise<SendEmailResult> {
  const baseUrl = getAppBaseUrl();
  const inr = (params.amountPaise / 100).toFixed(0);
  const html = emailWrapper(`
    <h2 style="margin-top: 0; font-size: 20px; color: #166534;">Payment Confirmed — Credits Added!</h2>
    <p style="font-size: 14px; color: #403e38;">
      Thank you for your purchase. Your account has been credited with the <strong>${params.skuName}</strong> pack.
    </p>
    <div class="meta-box">
      <p style="margin: 0 0 6px;"><strong>Amount Paid:</strong> ₹${inr} INR</p>
      <p style="margin: 0 0 6px;"><strong>Order ID:</strong> ${params.orderId}</p>
      <p style="margin: 0 0 6px;"><strong>Contact Reveals Added:</strong> +${params.contactCredits}</p>
      <p style="margin: 0;"><strong>AI Resume Drafts Added:</strong> +${params.aiCredits}</p>
    </div>
    <p style="font-size: 14px; color: #403e38;">Your new balances are active immediately in your workspace.</p>
    <a href="${baseUrl}/app/billing" class="button">View My Balances &rarr;</a>
  `);

  return sendEmail({
    to: params.userEmail,
    subject: `Payment Receipt: ${params.skuName} Pack (₹${inr})`,
    html,
  });
}
