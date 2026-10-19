import { SectionShell } from "@/components/marketing/sections/shell";

/**
 * §3 — the problem, stated from the applicant's side. The dark diagnosis panel
 * is the page's first tonal break, and the reasons stay as ruled entries rather
 * than another card row.
 */
export function Problem() {
  const frictions = [
    {
      title: "The 500+ applicant black hole",
      body: "Public postings collect hundreds of automated submissions in minutes. Opaque ATS keyword filters discard competent engineers before a human ever looks.",
    },
    {
      title: "Direct engineering alignment",
      body: "Engineering Managers and Founders are motivated by stack fit, code quality, and immediate problem-solving. ReachBee bridges you to technical peers.",
    },
    {
      title: "Grounding beats AI slop",
      body: "Hiring managers delete generic AI cover letters on sight. The Grounding Engine binds your verified achievements to the target stack: no fabricated percentages, no invented claims.",
    },
  ];

  return (
    <SectionShell
      id="problem"
      index="02"
      eyebrow="Market problem"
      heading={
        <>
          Beyond saturated job portals. Direct to technical decision-makers.
        </>
      }
      lede="Traditional application funnels have broken down under bot spam and algorithmic black holes. Applying into portal forms leaves your career to chance in a 500-resume stack."
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16">
        <ol className="space-y-0" data-motion="stagger">
          {frictions.map((f, i) => (
            <li
              key={f.title}
              data-motion="stagger-item"
              className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 border-t border-border-decorative py-6 first:pt-0 first:border-t-0"
            >
              <span className="tabular pt-0.5 text-[0.6875rem] font-semibold text-text-disabled">0{i + 1}</span>
              <div>
                <h3 className="text-[0.9375rem] font-bold tracking-[-0.01em] text-ink">{f.title}</h3>
                <p className="mt-2 text-[0.875rem] leading-[1.7] text-text-secondary">{f.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="brand-panel on-ink relative overflow-hidden rounded-scene bg-ink p-7 text-surface md:p-9" data-motion="reveal">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-surface/50">
            The portal breakdown
          </p>
          <p className="mt-6 font-editorial text-[1.375rem] font-medium leading-[1.45] tracking-[-0.01em] text-surface md:text-[1.5rem]">
            A posting that once collected a few dozen applications now collects hundreds of automated ones within
            minutes. Keyword filters sort on tokens, not on what you can actually build.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-surface/15 pt-6">
            <div>
              <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-surface/45">The funnel</dt>
              <dd className="mt-2 text-[0.875rem] font-semibold leading-snug text-surface">
                Hundreds of automated applications
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-surface/45">The filter</dt>
              <dd className="mt-2 text-[0.875rem] font-semibold leading-snug text-surface">
                Keywords, not capability
              </dd>
            </div>
          </dl>

          <p className="mt-8 border-t border-surface/15 pt-6 text-[0.875rem] leading-relaxed text-surface/70">
            ReachBee is the precision alternative: direct, truthful outreach to the engineering leads who evaluate
            technical merit.
          </p>
        </aside>
      </div>
    </SectionShell>
  );
}
