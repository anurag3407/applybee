export type HelpArticle = {
  slug: string;
  category: "Getting started" | "Credits" | "Gmail" | "Resumes" | "Payments";
  title: string;
  body: string[];
  related: string[];
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "get-started",
    category: "Getting started",
    title: "Getting started with Apply Bee",
    body: [
      "Create an account — no card required. You get a small trial allowance of contact reveals and AI generations.",
      "Confirm a few profile facts (from your resume or typed by hand). AI drafts use only confirmed facts.",
      "Find a contact or enter your own recipient. Write manually for free, or generate a draft for one AI credit.",
      "Review the draft, edit it as you like, and either copy it or create a Gmail draft (optional). Sending is always your action.",
    ],
    related: ["when-credits-charge", "use-without-gmail"],
  },
  {
    slug: "when-credits-charge",
    category: "Credits",
    title: "When credits are charged (and when they aren’t)",
    body: [
      "Contact reveals: one credit the first time you reveal a directory email. Reopening or copying it later is always free.",
      "AI generations: one credit when a validated draft is saved to your account. If generation fails, the credit is released automatically.",
      "AI drafting is capped at 10 drafts per day per account, whatever your balance. Unused credits are never lost — they simply wait until tomorrow.",
      "Manual editing, templates, saving, copying, .eml export, and the pipeline: always free.",
      "Gmail draft creation: no AI credit. Delivery quotas apply to prevent abuse.",
    ],
    related: ["get-started", "refunds"],
  },
  {
    slug: "use-without-gmail",
    category: "Gmail",
    title: "Using Apply Bee without Gmail",
    body: [
      "Everything except mailbox draft creation works without connecting Gmail: writing, AI drafts, templates, saving, copying, .eml export, and the pipeline.",
      "When you connect Gmail, Google’s permission allows managing drafts and sending email. Apply Bee uses it only to create drafts you approved — we never send automatically or read your inbox.",
      "You can disconnect at any time from Settings → Integrations. Your drafts stay saved here.",
    ],
    related: ["gmail-failed"],
  },
  {
    slug: "gmail-failed",
    category: "Gmail",
    title: "What if Gmail draft creation fails?",
    body: [
      "Known failure (permission, quota): your draft stays saved in Apply Bee. Fix the cause (e.g. reconnect) and retry, or copy the text.",
      "Uncertain outcome: if Gmail accepted the request but we lost the confirmation, we mark it “checking” and try a bounded reconciliation. If it stays unresolved you’ll see “Needs confirmation” — check your Gmail Drafts folder before creating another copy.",
      "We never blindly retry a Gmail creation, because that could duplicate drafts.",
    ],
    related: ["use-without-gmail"],
  },
  {
    slug: "resume-upload",
    category: "Resumes",
    title: "Uploading and reviewing your resume",
    body: [
      "PDF only, up to 5 MiB and 10 pages. Files are scanned and structurally validated before anything can use them.",
      "After parsing, you review every extracted fact. Nothing goes to AI until you confirm the profile.",
      "Delete or replace resumes any time from Career profile → Resumes. Existing drafts keep the version they were attached to.",
    ],
    related: ["when-credits-charge"],
  },
  {
    slug: "refunds",
    category: "Payments",
    title: "Payments and refunds",
    body: [
      "Packs are one-time purchases in INR via Razorpay (UPI, cards, netbanking). No subscriptions, no auto-renewal.",
      "Credits appear as soon as your payment is confirmed — usually seconds. If the confirmation is delayed, don’t pay again; the order page shows live status and grants exactly once.",
      "Unused purchased credits are refundable under the refunds policy. Contact support with your payment reference.",
    ],
    related: ["when-credits-charge"],
  },
];

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
