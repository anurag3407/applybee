/** Legal document content. Effective dates reflect this build (2026-10-04).
 *  Production launch requires legal review — tracked in
 *  docs/implementation-status.md. */

export type LegalDoc = {
  slug: string;
  title: string;
  summary: string;
  updated: string;
  sections: Array<{ heading: string; body: string[] }>;
};

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy policy",
    summary: "What we collect, why, who processes it, and how deletion works.",
    updated: "2026-10-04",
    sections: [
      {
        heading: "What we collect and why",
        body: [
          "Account data (email, display name) to create and secure your account.",
          "Candidate profile facts you confirm, and resume files you optionally upload, to ground AI drafts in your real experience.",
          "Draft content you write or generate, recipients you choose, and pipeline entries you track, to run the workspace.",
          "Operational records (credit ledger, payments, deliveries, security audit events) to keep the service correct and auditable.",
        ],
      },
      {
        heading: "AI processing",
        body: [
          "When you generate a draft, the profile facts you have confirmed, relevant company evidence, and any job description you paste are sent to our model provider to produce the draft. When you upload a resume, the extracted text is sent to the same provider to extract facts for your review. Manual writing, templates, and copying never call the model provider.",
          "Our current model provider is OpenRouter (openrouter.ai); if that changes we will update this policy before the change takes effect. Data sent to the provider is limited to the inputs needed for that one request and is not used to train models under our commercial terms with that provider. See the provider's own terms for the model you select.",
        ],
      },
      {
        heading: "Gmail access",
        body: [
          "If you connect Gmail, we request the gmail.compose scope from a dedicated OAuth project. Google documents this scope as permitting managing drafts and sending email. Apply Bee uses it only to create drafts you explicitly approved; we do not read your inbox or send messages automatically.",
          "We store the minimum tokens needed, encrypted (AES-256-GCM), and you can disconnect at any time from Settings → Integrations.",
        ],
      },
      {
        heading: "Retention and deletion",
        body: [
          "Drafts, profiles, and resumes persist until you delete them or close your account.",
          "Quarantined/failed uploads are removed within 24 hours. Operational logs are kept 14–30 days without private content. Financial records are retained as required by law, pseudonymized where lawful.",
          "Account deletion blocks new work immediately and removes files and derived content; existing Gmail drafts already created in your mailbox remain there — we cannot remove external copies.",
        ],
      },
      {
        heading: "Processors",
        body: [
          "Neon (database and resume file storage), Upstash (rate limiting), Resend (transactional email such as receipts and the daily digest), OpenRouter (model API), Razorpay (payments), Google (Gmail API), and Cloudflare (hosting and CDN). Contact directory data is licensed from verified sources only; see the Contact data policy.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of service",
    summary: "The agreement between you and Apply Bee.",
    updated: "2026-10-04",
    sections: [
      {
        heading: "The service",
        body: [
          "Apply Bee is a career outreach workspace: a contact directory, drafting tools, and a personal pipeline. Apply Bee never sends email on your behalf; drafts are created only after your explicit approval, and sending is always your action.",
        ],
      },
      {
        heading: "Credits",
        body: [
          "Contact reveals and AI generations consume credits as displayed before each action. One validated AI artifact costs one AI credit; failed generations are released automatically. AI drafting is additionally limited to 10 drafts per day per account, which caps how quickly a credit balance can be spent. Packs are one-time purchases and do not expire during ordinary service.",
        ],
      },
      {
        heading: "Your obligations",
        body: [
          "Use real, accurate information about yourself. Don’t misrepresent your identity, fabricate credentials, harass recipients, send bulk unsolicited mail, scrape the directory, or resell access. See the Acceptable use policy.",
        ],
      },
      {
        heading: "No outcome guarantee",
        body: [
          "Apply Bee does not guarantee interviews, replies, hiring, or email deliverability. Directory verification describes mailbox checks at a point in time, not hiring intent or consent.",
        ],
      },
      {
        heading: "Availability and changes",
        body: [
          "We may modify or discontinue features with notice where feasible. Kill switches may temporarily disable AI, Gmail delivery, uploads, or sales to protect users — disabled features are announced in the app, never silently.",
        ],
      },
    ],
  },
  {
    slug: "refunds",
    title: "Refund policy",
    summary: "When unused credits are refundable, and how disputes work.",
    updated: "2026-10-04",
    sections: [
      {
        heading: "Unused allowance",
        body: [
          "For purchased one-time packs, unused credits are refundable within the window and per the process published at checkout, consistent with applicable consumer law. We allocate consumption to specific credit lots, so refunds remove only genuinely unused quantities.",
        ],
      },
      {
        heading: "After consumption",
        body: [
          "Consumed credits (reveals completed, validated drafts generated) are generally not refundable. If a revealed address is confirmed invalid, support grants one audited replacement reveal credit under the published policy.",
        ],
      },
      {
        heading: "Disputes and chargebacks",
        body: [
          "Chargebacks after consumption may create a restriction record on the account pending review. Balances never go negative; disputed quantities are handled through an explicit debt/review process, not silent confiscation.",
        ],
      },
      {
        heading: "How to request",
        body: [
          "Contact us via the Contact page with your payment reference. Refund decisions are audited; approved refunds are processed through the original payment provider.",
        ],
      },
    ],
  },
  {
    slug: "acceptable-use",
    title: "Acceptable use policy",
    summary: "What you may not do with Apply Bee.",
    updated: "2026-10-04",
    sections: [
      {
        heading: "Prohibited",
        body: [
          "Bulk or automated outreach; sending to anyone who opted out; impersonation; fabricated credentials or invented referrals; harassment or discriminatory filtering; scraping or mass-exporting the directory; reselling contact data; using purchased contact lists from unverified sources.",
        ],
      },
      {
        heading: "Enforcement",
        body: [
          "Violations can lead to account restriction and, where required, reporting. Reports of abuse can be made via the Contact page; data subjects can request removal via the contact-data request form.",
        ],
      },
    ],
  },
  {
    slug: "contact-data",
    title: "Contact data policy",
    summary: "Where directory contacts come from, what “verified” means, and your rights.",
    updated: "2026-10-04",
    sections: [
      {
        heading: "Provenance",
        body: [
          "Directory records are licensed from providers with documented rights for professional contact distribution. Every record carries source, license reference, and collection date in our systems. We do not scrape private profiles or buy unknown CSVs.",
        ],
      },
      {
        heading: "What verification means",
        body: [
          "Verification describes an email check (e.g. SMTP-level mailbox existence) at a stated date. It does not mean the person is actively hiring, consents to outreach, or that delivery is guaranteed. Employment freshness is tracked separately from email validity.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "If you are in the directory, you can request correction or removal without an account via the contact-data request form. Removal prevents new reveals and re-import; delivery-wide suppression also blocks drafts to your address even if entered manually by a user.",
        ],
      },
      {
        heading: "Honest limits",
        body: [
          "Data previously revealed to users cannot be recalled from their copies. We enforce suppression going forward and recheck it immediately before any Gmail draft creation.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie notice",
    summary: "The actual cookies Apply Bee sets.",
    updated: "2026-10-04",
    sections: [
      {
        heading: "Essential cookies",
        body: [
          "ab_session — your signed-in session (httpOnly, SameSite=Lax, 30 days). Required for the workspace; no consent needed because nothing else would work.",
          "Authentication providers (when enabled) may set their own essential cookies during sign-in.",
        ],
      },
      {
        heading: "Analytics",
        body: [
          "Non-essential analytics cookies are off by default; product analytics, when enabled, uses safe event categories without draft content, names, or addresses, and is described here first.",
        ],
      },
    ],
  },
];

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}
