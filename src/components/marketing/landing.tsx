import Link from "next/link";
import { BrandMark } from "@/components/marketing/brand";
import { Badge, Button } from "@/components/ui/primitives";
import { formatINRPaise } from "@/lib/format";
import type { CatalogView } from "@/server/services/catalog";

/**
 * Twelve landing sections (§10). All example data is fictional with reserved
 * example.com domains, labeled "Illustrative preview". No fake testimonials,
 * logo walls, or invented statistics anywhere.
 */

function SectionShell({
  id,
  eyebrow,
  heading,
  children,
  tone = "canvas",
  headingClass,
}: {
  id?: string;
  eyebrow?: string;
  heading: React.ReactNode;
  children: React.ReactNode;
  tone?: "canvas" | "surface" | "ink";
  headingClass?: string;
}) {
  return (
    <section
      id={id}
      className={tone === "surface" ? "border-y border-border-decorative bg-surface" : tone === "ink" ? "on-ink bg-ink text-surface" : ""}
    >
      <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 py-16 md:py-28">
        {eyebrow ? (
          <p className={`mb-3 text-sm font-bold uppercase tracking-[0.14em] ${tone === "ink" ? "text-honey" : "text-text-secondary"}`} data-motion="reveal">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`font-bold tracking-[-0.02em] ${tone === "ink" ? "text-surface" : "text-ink"} ${headingClass ?? "clamp-heading"}`}
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 1.1 }}
          data-motion="reveal"
        >
          {heading}
        </h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

/* 1. Hero */
export function Hero({ trial }: { trial: { contact: number; ai: number } | null }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[calc(var(--ab-container-marketing))] items-center gap-12 px-5 pb-16 pt-14 md:grid-cols-12 md:py-24">
        <div className="md:col-span-7">
          <h1
            className="font-bold tracking-[-0.045em] text-ink"
            style={{ fontSize: "clamp(2.75rem, 6vw, 5.5rem)", lineHeight: 1.04 }}
            data-motion="reveal"
          >
            Skip the 500-applicant black hole. Reach <span className="font-editorial font-medium text-ink">engineering leaders directly.</span>
          </h1>
          <p className="prose-measure mt-6 text-lg text-text-secondary" data-motion="reveal">
            Public job boards on LinkedIn and Indeed have become algorithmic dead ends. ReachBee AI grounds your proven engineering achievements into bespoke introductions staged directly in your personal Gmail Drafts.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3" data-motion="reveal">
            <Link href="/sign-up">
              <Button variant="accent" className="min-h-12 px-6 text-base">
                Start free
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" className="min-h-12 px-6 text-base">
                See how it works
              </Button>
            </Link>
          </div>
          {trial ? (
            <p className="mt-4 text-sm text-text-secondary" data-motion="reveal">
              {trial.contact} contact reveals · {trial.ai} AI generations · No card required
            </p>
          ) : null}
        </div>
        <div className="md:col-span-5" data-motion="reveal">
          <HeroScene />
        </div>
      </div>
    </section>
  );
}

function HeroScene() {
  return (
    <figure className="rounded-scene border border-border-decorative bg-surface p-4 shadow-float">
      <figcaption className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-disabled">
        Illustrative preview
      </figcaption>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-control border border-border-decorative bg-canvas px-3 py-2.5">
          <div>
            <p className="text-sm font-bold text-ink">Priya Sharma</p>
            <p className="text-xs text-text-secondary">Eng Manager, Platform · Lumen Analytics</p>
          </div>
          <Badge tone="honey">•••@lumen-analytics.example</Badge>
        </div>
        <div className="rounded-control border border-border-decorative bg-canvas px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Confirmed fact</p>
          <p className="mt-1 text-sm text-ink">Built an events pipeline handling 40k events/min (per your project notes).</p>
        </div>
        <div className="rounded-control border border-border-decorative bg-surface-raised px-3 py-3">
          <p className="text-sm font-semibold text-ink">Subject: Platform role — background that may fit Lumen</p>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
            Hi Priya, I’m Aarav. I built a realtime events pipeline last year and noticed your team works on
            fintech analytics pipelines…
          </p>
          <div className="mt-2 flex items-center justify-between">
            <Badge tone="success">Ready for review</Badge>
            <span className="text-xs text-text-disabled">Nothing is sent without your approval</span>
          </div>
        </div>
      </div>
    </figure>
  );
}

/* 2. Product facts */
export function ProductFacts() {
  const facts = [
    { title: "Verified decision-makers", body: "Direct directory of Engineering Managers, Tech Leads, and Founders — with source freshness and verification labels shown plainly." },
    { title: "Grounding Engine (Zero Hallucination)", body: "AI drafts are written only from details you have confirmed. If a metric isn’t in your resume, we never invent one." },
    { title: "Deliverability Shield (10/day cap)", body: "Capped at 10 drafts/day by design to protect your personal Gmail domain reputation, avoid spam traps, and maximize open rates." },
    { title: "You review before sending", body: "ReachBee prepares drafts in your personal Gmail. You edit, approve, and press send yourself — nothing leaves without your eyes on it." },
  ];
  return (
    <SectionShell tone="surface" id="features" heading="What ReachBee actually does" headingClass="text-[clamp(1.8rem,3vw,2.6rem)]">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-motion="stagger">
        {facts.map((f) => (
          <div key={f.title} data-motion="stagger-item" className="rounded-card border border-border-decorative bg-surface p-5 shadow-card">
            <h3 className="text-lg font-bold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{f.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-text-secondary" data-motion="reveal">
        Understand our data and permissions in the{" "}
        <Link href="/legal/contact-data" className="font-semibold text-ink underline">
          contact-data policy
        </Link>{" "}
        and the{" "}
        <Link href="/security" className="font-semibold text-ink underline">
          security page
        </Link>
        .
      </p>
    </SectionShell>
  );
}

/* 3. Problem */
export function Problem() {
  const frictions = [
    {
      title: "The 500+ Applicant Black Hole",
      body: "Public job postings on LinkedIn and Indeed receive 500+ automated submissions within minutes. Opaque ATS keyword filters discard competent Tier-2/3 grads and experienced engineers before a human ever looks.",
    },
    {
      title: "Direct Engineering Alignment",
      body: "Corporate HR recruiters are evaluated on gatekeeping and compliance; Engineering Managers and Founders are motivated by tech stack fit, code quality, and immediate problem-solving. ReachBee bridges you directly to technical peers.",
    },
    {
      title: "Deterministic Grounding vs. AI Slop",
      body: "Hiring managers instantly delete generic AI cover letters. ReachBee's Grounding Engine strictly binds your verified project achievements to target tech stacks—no fabricated percentages, no fake claims.",
    },
  ];
  return (
    <SectionShell
      id="problem"
      eyebrow="Market Problem & Positioning"
      heading={<>Beyond saturated job portals.<br />Direct to technical decision-makers.</>}
    >
      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <div data-motion="reveal" className="rounded-card border border-border-decorative bg-surface p-5 shadow-card">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary">The Portal Breakdown</h3>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Traditional application funnels have broken down under bot spam and algorithmic black holes. Applying into portal forms leaves your career to chance in a 500-resume stack.
          </p>
          <p className="mt-4 text-sm font-semibold text-ink">
            ReachBee is your precision alternative: direct, truthful outreach to the engineering leads who evaluate technical merit.
          </p>
        </div>
        <div className="grid gap-4" data-motion="stagger">
          {frictions.map((f) => (
            <div key={f.title} data-motion="stagger-item" className="rounded-card border border-border-decorative bg-surface p-5">
              <h3 className="font-bold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

/* 4. Directory feature */
export function DirectoryFeature() {
  const rows = [
    { name: "Priya Sharma", title: "Eng Manager, Platform", company: "Lumen Analytics", location: "Bengaluru", verification: "Verified · checked 12 d ago" },
    { name: "Karthik Subramanian", title: "Principal Engineer", company: "Meridian Cloud", location: "Remote (India)", verification: "Verified · checked 9 d ago" },
    { name: "Sneha Kulkarni", title: "Technical Recruiter", company: "Kite Robotics", location: "Pune", verification: "Catch-all · checked 20 d ago" },
  ];
  return (
    <SectionShell tone="surface" id="directory" heading="Start with a person—not a generic inbox.">
      <div className="rounded-scene border border-border-decorative bg-canvas p-4 shadow-card" data-motion="reveal">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge>Role: Engineering manager</Badge>
          <Badge>Location: Bengaluru</Badge>
          <Badge>Stage: Growth</Badge>
          <Badge tone="honey">Illustrative preview</Badge>
        </div>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Example directory rows</caption>
          <thead>
            <tr className="border-b border-border-decorative text-xs uppercase tracking-wide text-text-secondary">
              <th className="py-2 pr-3 font-semibold">Name & title</th>
              <th className="py-2 pr-3 font-semibold">Company</th>
              <th className="py-2 pr-3 font-semibold">Location</th>
              <th className="py-2 font-semibold">Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-border-decorative/60 last:border-0">
                <td className="py-3 pr-3">
                  <p className="font-bold text-ink">{r.name}</p>
                  <p className="text-xs text-text-secondary">{r.title}</p>
                </td>
                <td className="py-3 pr-3 text-text-secondary">{r.company}</td>
                <td className="py-3 pr-3 text-text-secondary">{r.location}</td>
                <td className="py-3">
                  <Badge tone="honey">•••@{r.company.toLowerCase().replace(/[^a-z]+/g, "-")}.example</Badge>
                  <p className="mt-1 text-xs text-text-disabled">{r.verification}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-text-disabled">
          Reveal shows the full address once, for one credit. Listing a contact never implies an active vacancy or consent to bulk outreach.
        </p>
      </div>
      <div className="mt-6 flex items-center gap-3" data-motion="reveal">
        <Link href="/sign-up">
          <Button variant="primary">Explore contacts</Button>
        </Link>
        <p className="text-sm text-text-secondary">Search, filters, and masked emails — free to browse.</p>
      </div>
    </SectionShell>
  );
}

/* 5. Resume intelligence */
export function ResumeIntelligence() {
  return (
    <SectionShell id="resume" heading="Your experience is the strongest part of the pitch.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-card border border-border-decorative bg-surface p-5 shadow-card" data-motion="reveal">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary">From your resume</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-control border border-border-decorative bg-canvas px-3 py-2.5 text-sm text-ink">
              “Built an events pipeline handling 40k events/min”
            </div>
            <div className="rounded-control border border-border-decorative bg-canvas px-3 py-2.5 text-sm text-ink">
              “Led migration of checkout service to TypeScript”
            </div>
            <div className="rounded-control border border-border-decorative bg-canvas px-3 py-2.5 text-sm text-ink">
              “Reduced manual reporting time (no metric stated in resume)”
            </div>
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            Review the profile we extract. Keep the details that are accurate; fix the ones that aren’t.
          </p>
        </div>
        <div className="rounded-card border border-border-decorative bg-surface p-5 shadow-card" data-motion="reveal">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary">In the draft</h3>
          <div className="mt-4 rounded-control border border-border-decorative bg-surface-raised px-3 py-3 text-sm leading-relaxed text-ink">
            Hi Priya — I built a realtime events pipeline last year
            <span className="mx-1 rounded bg-honey-wash px-1 py-0.5 text-xs font-semibold">(fact 1)</span>
            and would love to talk about your platform work.
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            Where your resume gives no number, the draft stays qualitative. A missing metric is never replaced with a
            confident-sounding guess.
          </p>
          <p className="mt-4">
            <Badge tone="info">Resume files stay private</Badge>{" "}
            <Link href="/legal/privacy" className="text-sm font-semibold text-ink underline">
              How we handle them
            </Link>
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

/* 6. Agentic workflow */
export function AgenticWorkflow() {
  const steps = [
    { title: "Choose your context", body: "Pick the intent — advertised role, internship, referral, or speculative intro — and paste a job description or role notes if you have one." },
    { title: "Prepare with evidence", body: "A bounded preparation step selects relevant confirmed facts and approved, dated company context. You see exactly what was used." },
    { title: "Review with Soft-Bypass", body: "The draft arrives with its evidence references and an optional Soft-Bypass closing line ('Happy to route this through your official careers portal if preferred') to eliminate HR friction." },
  ];
  return (
    <SectionShell tone="surface" id="agentic" heading="A little preparation. A much better introduction.">
      <ol className="grid gap-4 md:grid-cols-3" data-motion="stagger">
        {steps.map((s, i) => (
          <li key={s.title} data-motion="stagger-item" className="rounded-card border border-border-decorative bg-canvas p-5">
            <p className="text-sm font-bold text-honey-deep">Step {i + 1}</p>
            <h3 className="mt-1 font-bold text-ink">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{s.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-card border border-border-decorative bg-surface p-5 shadow-card" data-motion="reveal">
        <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary">Evidence panel (example)</h3>
        <ul className="mt-3 space-y-2 text-sm text-ink">
          <li className="flex flex-wrap items-center gap-2">
            <Badge tone="honey">Fact #12</Badge> “Built an events pipeline handling 40k events/min” — confirmed by you
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <Badge tone="info">Company note</Badge> “Public job posts mention Kafka, Flink, and Go services.” — source: careers page snapshot, Sep 2026
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <Badge tone="success">Soft-Bypass Option</Badge> Includes polite official portal routing offer to eliminate recruiter protocol pushback.
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <Badge tone="warning">Uncertainty</Badge> No public evidence the team is hiring right now — the draft doesn’t claim it.
          </li>
        </ul>
      </div>
      <div className="mt-6" data-motion="reveal">
        <Link href="/sign-up">
          <Button variant="primary">Try agentic drafting</Button>
        </Link>
      </div>
    </SectionShell>
  );
}

/* 7. Three writing modes */
export function WritingModes() {
  const modes = [
    {
      key: "Manual",
      body: "Write from scratch or from your personal templates with deterministic placeholders. Template use never calls AI.",
      chip: "No AI credits used",
      tone: "success" as const,
    },
    {
      key: "Quick AI",
      body: "Give the intent, the recipient, and optional job description. A validated, editable draft appears with its supporting facts and optional soft-bypass.",
      chip: "1 AI credit per generation",
      tone: "honey" as const,
    },
    {
      key: "Agentic",
      body: "A bounded preparation pass selects proof points, checks approved company context, and explains its reasoning in evidence, not a black box.",
      chip: "1 AI credit · capped budget",
      tone: "honey" as const,
    },
  ];
  return (
    <SectionShell id="how-it-works" heading="Write it yourself. Get a quick start. Or go deeper.">
      <div className="grid gap-4 md:grid-cols-3" data-motion="stagger">
        {modes.map((m) => (
          <div key={m.key} data-motion="stagger-item" className="rounded-card border border-border-decorative bg-surface p-5 shadow-card">
            <h3 className="text-lg font-bold text-ink">{m.key}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{m.body}</p>
            <div className="mt-4">
              <Badge tone={m.tone}>{m.chip}</Badge>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-text-secondary" data-motion="reveal">
        Switching modes never destroys your text. Manual editing is always free — AI is optional, and one validated
        generation costs exactly one credit.
      </p>
    </SectionShell>
  );
}

/* 8. Hiring workspace */
export function WorkspaceTeaser() {
  const stages = ["Interested", "Draft ready", "Contacted", "Conversation", "Interview", "Offer"];
  return (
    <SectionShell tone="ink" id="workspace" heading="Keep your next move in view.">
      <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="rounded-scene border border-white/10 bg-white/5 p-5" data-motion="reveal">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/60">Pipeline · Illustrative</p>
          <div className="flex flex-wrap gap-2">
            {stages.map((s, i) => (
              <span
                key={s}
                className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${
                  i === 1 ? "bg-honey text-ink" : "border border-white/20 text-white/80"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
          <div className="mt-5 space-y-2 text-sm text-white/80">
            <p className="rounded-control border border-white/10 bg-white/5 px-3 py-2">
              Meridian Cloud — Platform engineer · draft ready · next step: follow up Thu
            </p>
            <p className="rounded-control border border-white/10 bg-white/5 px-3 py-2">
              Arambh Fintech — Backend role · conversation started · note: spoke to Meera on Tue
            </p>
          </div>
          <p className="mt-4 text-xs font-semibold text-honey">
            Stages are updated by you. We don’t read your inbox.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-4" data-motion="reveal">
          <p className="text-white/80">
            Notes and next-action dates matter more than vanity charts. Reminders appear inside ReachBee — nothing is
            sent automatically, and no reply metrics are inferred.
          </p>
          <Link href="/sign-up">
            <Button variant="accent" className="self-start">
              See the workspace
            </Button>
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}

/* 9. Trust */
export function Trust() {
  const principles = [
    { title: "Explicit Gmail connection", body: "Connecting Gmail is optional and separate from signing in. You choose when — and you can disconnect any time." },
    { title: "Deliverability Shield (10/day)", body: "Capped at 10 drafts/day per account to protect your personal Gmail domain reputation, avoid Google spam triggers, and maintain high open rates." },
    { title: "Private resumes", body: "Your files sit in private storage, scanned and gated. Downloads require your signed-in session. Nothing becomes public." },
    { title: "Truthful AI", body: "Drafts cite the facts they use. Unsupported claims are rejected, not dressed up." },
    { title: "Visible costs", body: "Every action shows its price before you confirm. Balances, reservations, and history are in the open." },
  ];
  return (
    <SectionShell id="trust" heading="Your review. Your account. Your decision.">
      <div className="rounded-card border border-border-decorative bg-surface p-6 shadow-card" data-motion="reveal">
        <p className="prose-measure text-lg font-medium text-ink">
          “Google’s permission allows managing drafts and sending email. ReachBee uses this connection to create drafts
          you approve. We do not send email automatically or read your inbox. You can disconnect at any time.”
        </p>
        <p className="mt-3 text-sm text-text-secondary">
          We say this plainly because the permission technically permits sending; our product and code do not. Nothing
          leaves your account without your explicit review.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-motion="stagger">
          {principles.map((p) => (
            <div key={p.title} data-motion="stagger-item" className="rounded-control border border-border-decorative bg-canvas p-4">
              <h3 className="font-bold text-ink">{p.title}</h3>
              <p className="mt-1 text-sm text-text-secondary">{p.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-text-secondary">
          Read the{" "}
          <Link href="/legal/privacy" className="font-semibold text-ink underline">
            privacy policy
          </Link>
          , the{" "}
          <Link href="/legal/contact-data" className="font-semibold text-ink underline">
            contact-data policy
          </Link>{" "}
          and our{" "}
          <Link href="/security" className="font-semibold text-ink underline">
            security notes
          </Link>
          .
        </p>
      </div>
    </SectionShell>
  );
}

/* 10. Pricing */
export function Pricing({ catalog }: { catalog: CatalogView | null }) {
  return (
    <SectionShell tone="surface" id="pricing" heading="Pay for the preparation you need.">
      {!catalog ? (
        <div className="rounded-card border border-warning/30 bg-warning-wash p-5" role="status">
          <p className="font-semibold text-warning">Pricing is temporarily unavailable.</p>
          <p className="mt-1 text-sm text-text-secondary">
            We show real prices only when our catalog loads. You can still sign in and use the free tools.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" data-motion="stagger">
            {catalog.skus.map((sku) => {
              const free = sku.pricePaise === 0;
              const balanced = sku.sku === "plus_v1";
              return (
                <div
                  key={sku.sku}
                  data-motion="stagger-item"
                  className={`flex flex-col rounded-card border bg-surface p-5 shadow-card ${
                    balanced ? "border-honey ring-1 ring-honey" : "border-border-decorative"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-ink">{sku.name}</h3>
                    {balanced ? <Badge tone="honey">Balanced starter pack</Badge> : null}
                  </div>
                  <p className="mt-2 text-3xl font-bold tabular text-ink">
                    {free ? "₹0" : formatINRPaise(sku.pricePaise)}
                  </p>
                  {!free ? <p className="text-xs font-semibold text-text-secondary">One-time purchase</p> : (
                    <p className="text-xs font-semibold text-text-secondary">Once per verified account</p>
                  )}
                  <ul className="mt-4 flex-1 space-y-1.5 text-sm text-text-secondary">
                    <li>{sku.contactCredits} contact {sku.contactCredits === 1 ? "reveal" : "reveals"}</li>
                    <li>{sku.aiCredits} AI {sku.aiCredits === 1 ? "generation" : "generations"}</li>
                    <li>Manual editor, templates, pipeline</li>
                    <li>Copy/export always included</li>
                  </ul>
                  <Link href={free ? "/sign-up" : `/sign-up?sku=${sku.sku}`} className="mt-5">
                    <Button variant={balanced ? "accent" : "secondary"} className="w-full">
                      {free ? "Start free" : "Choose"}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-card border border-border-decorative bg-canvas p-5 text-sm text-text-secondary" data-motion="reveal">
            <p className="font-semibold text-ink">What things cost in practice</p>
            <p className="mt-2">
              Already know the person? Entering your own recipient and writing manually is free — no reveal or AI charge.
              New contact + AI draft = one reveal credit and one AI credit, shown together before you confirm.
            </p>
            <p className="mt-2">
              Packs are one-time purchases; balances add up and never overwrite unused credits. Prices are inclusive as
              displayed; see the{" "}
              <Link href="/legal/refunds" className="font-semibold text-ink underline">
                refunds policy
              </Link>
              .
            </p>
          </div>
        </>
      )}
    </SectionShell>
  );
}

/* 11. FAQ */
const FAQS: Array<{ q: string; a: string }> = [
  { q: "Does ReachBee send emails for me?", a: "No. ReachBee prepares drafts. You review, edit, and send them yourself — or copy the text anywhere." },
  { q: "Why is there a daily limit of 10 AI drafts?", a: "To protect your personal Gmail domain reputation. Sending dozens of cold emails triggers Google's automated abuse filters and burns your personal address. A 10/day limit enforces quality and keeps your outreach landing directly in the recipient's primary inbox." },
  { q: "Won't recruiters get upset if I reach out to engineering managers directly?", a: "ReachBee supports a 'Soft-Bypass' protocol. Drafts focus strictly on technical stack alignment and can include a courteous closing line offering to route through their official careers portal if preferred. This transforms outreach from an aggressive bypass into a professional peer introduction." },
  { q: "What exactly does the Gmail permission allow?", a: "Google’s gmail.compose permission allows managing drafts and sending email. ReachBee uses it only to create drafts you approved. We don’t read your inbox or send mail automatically." },
  { q: "Can I use it without connecting Gmail?", a: "Yes. Manual writing, quick AI, templates, copy/export, and the pipeline all work without Gmail. Connecting is only for creating drafts in your mailbox." },
  { q: "Can I draft manually for free?", a: "Yes. The manual editor, templates, saving, and copying use no AI credits and require no purchase beyond browsing/reveals." },
  { q: "When is a credit consumed?", a: "A reveal credit when a directory email is unlocked the first time. An AI credit when a validated draft is saved to your account — not when generation starts and not when Gmail succeeds." },
  { q: "Do repeated email reveals cost again?", a: "No. Once you reveal a contact, reopening or copying that email is always free." },
  { q: "What does “verified” mean?", a: "A verification provider checked the address recently. It means the mailbox existed at check time — not that the person is hiring, expects outreach, or that delivery is guaranteed." },
  { q: "What happens when AI or Gmail fails?", a: "If generation fails, your AI credit is released automatically. If Gmail fails, your draft stays saved here and you can retry, reconcile, or copy the text." },
  { q: "Are these subscriptions?", a: "No. Packs are one-time purchases. No auto-renewal, no cancellation dates." },
  { q: "Do credits expire, and how do refunds work?", a: "Paid credits don’t expire during ordinary service. Unused purchased allowance is refundable under our published refunds policy." },
  { q: "Can I delete my resume and profile?", a: "Yes — delete files or the whole account from settings. Deleting app content doesn’t remove copies you already created in Gmail." },
  { q: "Will this guarantee interviews or a job?", a: "No. Nothing can. ReachBee helps you prepare relevant, truthful introductions — outcomes depend on you and the market." },
];

export function FAQ() {
  return (
    <SectionShell id="faq" heading="Questions people actually ask.">
      <div className="grid gap-3 md:grid-cols-2" data-motion="reveal">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-card border border-border-decorative bg-surface p-4 open:shadow-card">
            <summary className="cursor-pointer list-none font-semibold text-ink marker:hidden">
              <span className="flex items-center justify-between gap-3">
                {f.q}
                <span aria-hidden className="text-text-secondary transition-transform group-open:rotate-45">＋</span>
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{f.a}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

/* 12. Final CTA */
export function FinalCta({ trial }: { trial: { contact: number; ai: number } | null }) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-[calc(var(--ab-container-marketing))] px-5 py-20 text-center md:py-32">
        <div className="mx-auto mb-6 w-fit" data-motion="reveal">
          <BrandMark size={48} />
        </div>
        <h2
          className="mx-auto max-w-3xl font-bold tracking-[-0.03em] text-ink"
          style={{ fontSize: "clamp(2.25rem, 5vw, 4.25rem)", lineHeight: 1.08 }}
          data-motion="reveal"
        >
          Make your next <span className="font-editorial font-medium">introduction</span> count.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3" data-motion="reveal">
          <Link href="/sign-up">
            <Button variant="accent" className="min-h-12 px-6 text-base">
              Start free
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary" className="min-h-12 px-6 text-base">
              View pricing
            </Button>
          </Link>
        </div>
        {trial ? (
          <p className="mt-4 text-sm text-text-secondary" data-motion="reveal">
            {trial.contact} contact reveals · {trial.ai} AI generations · No card required
          </p>
        ) : null}
      </div>
    </section>
  );
}
