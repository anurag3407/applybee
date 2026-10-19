import Link from "next/link";
import { Badge, Button } from "@/components/ui/primitives";
import { PreviewPanel, SectionShell } from "@/components/marketing/sections/shell";
import { FeatureIcon } from "@/components/marketing/feature-icon";

/**
 * §4 — the directory. The table is an illustrative preview with reserved
 * .example domains; the masked-email treatment is what the workspace renders
 * before a reveal.
 */
export function DirectoryFeature({ standalone = false }: { standalone?: boolean }) {
  const rows = [
    {
      name: "Priya Sharma",
      initials: "PS",
      title: "Eng Manager, Platform",
      company: "Lumen Analytics",
      location: "Bengaluru",
      verification: "Verified · checked 12 d ago",
    },
    {
      name: "Karthik Subramanian",
      initials: "KS",
      title: "Principal Engineer",
      company: "Meridian Cloud",
      location: "Remote (India)",
      verification: "Verified · checked 9 d ago",
    },
    {
      name: "Sneha Kulkarni",
      initials: "SK",
      title: "Technical Recruiter",
      company: "Kite Robotics",
      location: "Pune",
      verification: "Catch-all · checked 20 d ago",
    },
  ];

  return (
    <SectionShell
      tone="surface"
      id="directory"
      index={standalone ? undefined : "03"}
      eyebrow="Contact directory"
      heading="Start with a person, not a generic inbox."
      lede="Search by role, stack, and city. Every listing shows its verification label and how recently it was checked before you spend anything."
    >
      <PreviewPanel
        label="Directory preview"
        aside={
          <span className="flex items-center gap-2 text-[0.6875rem] font-semibold text-text-disabled">
            <span aria-hidden className="h-1.5 w-1.5 bg-honey" />
            Illustrative
          </span>
        }
      >
        <div className="mb-5 flex flex-col gap-3 border-b border-border-decorative pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Badge tone="honey">Role: Engineering manager</Badge>
            <Badge>Location: Bengaluru</Badge>
            <Badge>Stage: Growth</Badge>
          </div>
          <p className="text-[0.75rem] text-text-disabled">Example results</p>
        </div>

        <div className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Example directory rows</caption>
            <thead>
              <tr className="border-b border-border-decorative text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-text-disabled">
                <th className="pb-3 pr-4 font-semibold">Name and title</th>
                <th className="pb-3 pr-4 font-semibold">Company</th>
                <th className="hidden pb-3 pr-4 font-semibold md:table-cell">Location</th>
                <th className="pb-3 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.name}
                  className="border-b border-border-decorative/60 transition-colors last:border-0 hover:bg-canvas/60"
                >
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-border-decorative bg-canvas text-[0.6875rem] font-bold text-text-secondary"
                      >
                        {r.initials}
                      </span>
                      <span>
                        <span className="block font-semibold text-ink">{r.name}</span>
                        <span className="block text-[0.75rem] text-text-secondary">{r.title}</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-[0.875rem] text-text-secondary">{r.company}</td>
                  <td className="hidden py-4 pr-4 text-[0.875rem] text-text-secondary md:table-cell">{r.location}</td>
                  <td className="py-4">
                    <span className="inline-flex rounded-xs border border-border-decorative bg-canvas px-2 py-1 text-[0.6875rem] font-semibold text-ink">
                      •••@{r.company.toLowerCase().replace(/[^a-z]+/g, "-")}.example
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5 text-[0.6875rem] text-text-disabled">
                      <FeatureIcon name="grounding" size={11} />
                      {r.verification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 border-t border-border-decorative pt-4 text-[0.75rem] leading-relaxed text-text-disabled">
          Reveal shows the full address once, for one credit. Listing a contact never implies an active vacancy or
          consent to bulk outreach.
        </p>
      </PreviewPanel>

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3" data-motion="reveal">
        <Link href="/sign-up">
          <Button variant="primary" size="lg">
            Explore contacts
          </Button>
        </Link>
        <p className="text-[0.8125rem] text-text-secondary">Search, filters, and masked emails are free to browse.</p>
      </div>
    </SectionShell>
  );
}
