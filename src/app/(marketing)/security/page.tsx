import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">Security</h1>
      <p className="mt-3 text-sm text-text-disabled">Last reviewed: 4 October 2026</p>
      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-ink">Permissions we ask for</h2>
          <ul className="prose-measure mt-2 space-y-2 text-[0.95rem] leading-relaxed text-text-secondary">
            <li>• <strong>Sign-in:</strong> your ReachBee account. Signing in with Google is separate from connecting Gmail.</li>
            <li>• <strong>Gmail (optional):</strong> the gmail.compose scope from a dedicated OAuth project. Google documents it as permitting managing drafts and sending email. ReachBee only creates drafts you approved — our code has no send path, and the HTTP layer rejects send endpoints even by mistake.</li>
            <li>• <strong>Nothing else:</strong> no mailbox reads, no contacts reads, no drive access.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Gmail Deliverability & Reputation Shield (10 drafts/day cap)</h2>
          <p className="prose-measure mt-2 text-[0.95rem] leading-relaxed text-text-secondary">
            Unlike bulk cold-email tools that blast hundreds of emails and burn personal email domains, ReachBee strictly caps generations at 10 drafts per day per account. This deliberate rate limit safeguards your personal Gmail sender score, prevents Google automated abuse flags, and ensures your outreach lands directly in the recipient&apos;s primary inbox rather than their spam folder.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Storage and files</h2>
          <p className="prose-measure mt-2 text-[0.95rem] leading-relaxed text-text-secondary">
            Resumes live in private storage with quarantine → scan → immutable clean storage. Downloads require your signed-in
            session and an ownership check on the server; there are no public or guessable file URLs, and a file must
            pass the scan gate before it can be downloaded or attached. Directory emails are protected at rest with
            envelope encryption and never appear in list responses, exports, or logs — only revealed to the account
            that unlocked them.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">AI data handling</h2>
          <p className="prose-measure mt-2 text-[0.95rem] leading-relaxed text-text-secondary">
            Generation sends only your confirmed profile facts, approved company evidence, and any job description you
            paste, to the model provider under commercial processing terms. Draft bodies, resumes, and tokens are never
            logged. Model output is validated against your fact snapshot before you ever see it.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Money and credits</h2>
          <p className="prose-measure mt-2 text-[0.95rem] leading-relaxed text-text-secondary">
            Payments run through Razorpay with server-side signature verification. Credits live in a transactional
            ledger with per-lot allocation: concurrent actions cannot double-charge, and a captured payment grants
            exactly once no matter how many confirmations arrive.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Responsible disclosure</h2>
          <p className="prose-measure mt-2 text-[0.95rem] leading-relaxed text-text-secondary">
            Found something? Email security reports via the <Link href="/contact" className="text-info underline">contact page</Link> with
            the “security” category. We triage quickly and credit coordinated disclosures where appropriate.
          </p>
        </section>
        <section className="rounded-card border border-border-decorative bg-surface p-5">
          <h2 className="font-bold text-ink">Current status</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="warning">Pre-launch: compliance certifications not yet held</Badge>
            <Badge tone="info">Draft-only Gmail enforcement in code and tests</Badge>
            <Badge tone="success">10 drafts/day deliverability rate-limiting active</Badge>
            <Badge tone="success">Transactional credit ledger with automated consistency checks</Badge>
          </div>
        </section>
      </div>
    </div>
  );
}
