import type { Metadata } from "next";
import { Badge } from "@/components/ui/primitives";
import { ArticleSection, PageMasthead, ReadingShell, TextLink } from "@/components/marketing/page-masthead";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { breadcrumbTrail, pageMetaFor } from "@/lib/seo";

export const metadata: Metadata = pageMetaFor("/security");

export default function SecurityPage() {
  return (
    <div>
      <JsonLd data={breadcrumbSchema(breadcrumbTrail("Security", "/security"))} />
      <PageMasthead
        eyebrow="Trust"
        title="Security"
        lede="What ReachBee can access, where your data lives, and what the product deliberately cannot do."
        meta="Last reviewed: 4 October 2026"
      />
      <ReadingShell label="Policy">
        <div className="space-y-9">
          <ArticleSection title="Permissions we ask for">
            <ul className="space-y-2">
              <li>
                • <strong className="font-semibold text-ink">Sign-in:</strong> your ReachBee account. Signing in with
                Google is separate from connecting Gmail.
              </li>
              <li>
                • <strong className="font-semibold text-ink">Gmail (optional):</strong> the gmail.compose scope from a
                dedicated OAuth project. Google documents it as permitting managing drafts and sending email. ReachBee
                only creates drafts you approved. Our code has no send path, and the HTTP layer rejects send endpoints
                even by mistake.
              </li>
              <li>
                • <strong className="font-semibold text-ink">Nothing else:</strong> no mailbox reads, no contacts reads,
                no drive access.
              </li>
            </ul>
          </ArticleSection>
          <ArticleSection title="Gmail Deliverability & Reputation Shield (10 drafts/day cap)">
            <p>
              Unlike bulk cold-email tools that blast hundreds of emails and burn personal email domains, ReachBee
              strictly caps generations at 10 drafts per day per account. This deliberate rate limit safeguards your
              personal Gmail sender score, prevents Google automated abuse flags, and ensures your outreach lands
              directly in the recipient&apos;s primary inbox rather than their spam folder.
            </p>
          </ArticleSection>
          <ArticleSection title="Storage and files">
            <p>
              Resumes live in private storage with quarantine → scan → immutable clean storage. Downloads require your
              signed-in session and an ownership check on the server; there are no public or guessable file URLs, and a
              file must pass the scan gate before it can be downloaded or attached. Directory emails are protected at
              rest with envelope encryption and never appear in list responses, exports, or logs. They are revealed only
              to the account that unlocked them.
            </p>
          </ArticleSection>
          <ArticleSection title="AI data handling">
            <p>
              Generation sends only your confirmed profile facts, approved company evidence, and any job description you
              paste, to the model provider under commercial processing terms. Draft bodies, resumes, and tokens are never
              logged. Model output is validated against your fact snapshot before you ever see it.
            </p>
          </ArticleSection>
          <ArticleSection title="Money and credits">
            <p>
              Payments run through Razorpay with server-side signature verification. Credits live in a transactional
              ledger with per-lot allocation: concurrent actions cannot double-charge, and a captured payment grants
              exactly once no matter how many confirmations arrive.
            </p>
          </ArticleSection>
          <ArticleSection title="Responsible disclosure">
            <p>
              Found something? Email security reports via the <TextLink href="/contact">contact page</TextLink> with the
              “security” category. We triage quickly and credit coordinated disclosures where appropriate.
            </p>
          </ArticleSection>
          <ArticleSection title="Current status">
            <div className="flex flex-wrap gap-2">
              <Badge tone="warning">Pre-launch: compliance certifications not yet held</Badge>
              <Badge tone="info">Draft-only Gmail enforcement in code and tests</Badge>
              <Badge tone="success">10 drafts/day deliverability rate-limiting active</Badge>
              <Badge tone="success">Transactional credit ledger with automated consistency checks</Badge>
            </div>
          </ArticleSection>
        </div>
      </ReadingShell>
    </div>
  );
}
