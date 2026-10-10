import Link from "next/link";
import { Badge, Button } from "@/components/ui/primitives";
import { PreviewPanel, SectionShell } from "@/components/marketing/sections/shell";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { CombTrace } from "@/components/marketing/atmosphere";

/**
 * §4 — the directory. The table is an illustrative preview with reserved
 * .example domains; the masked-email treatment it shows is exactly what the
 * real workspace renders before a reveal.
 */
export function DirectoryFeature() {
  const rows = [
    { name: "Priya Sharma", title: "Eng Manager, Platform", company: "Lumen Analytics", location: "Bengaluru", verification: "Verified · checked 12 d ago" },
    { name: "Karthik Subramanian", title: "Principal Engineer", company: "Meridian Cloud", location: "Remote (India)", verification: "Verified · checked 9 d ago" },
    { name: "Sneha Kulkarni", title: "Technical Recruiter", company: "Kite Robotics", location: "Pune", verification: "Catch-all · checked 20 d ago" },
  ];

  return (
    <SectionShell
      tone="surface"
      id="directory"
      eyebrow="Contact directory"
      heading="Start with a person, not a generic inbox."
      lede="Search by role, stack, and city. Every listing shows its verification label and how recently it was checked — before you spend anything."
    >
      <PreviewPanel
        label="Directory preview"
        aside={
          <span className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-honey-deep dark:text-honey">
            <CombTrace cells={4} size={12} className="text-honey" />
            Illustrative
          </span>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone="honey">Role: Engineering manager</Badge>
          <Badge>Location: Bengaluru</Badge>
          <Badge>Stage: Growth</Badge>
        </div>

        <div className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Example directory rows</caption>
            <thead>
              <tr className="border-b border-border-decorative text-xs font-bold uppercase tracking-[0.1em] text-text-disabled">
                <th className="py-2.5 pr-3">Name &amp; title</th>
                <th className="py-2.5 pr-3">Company</th>
                <th className="hidden py-2.5 pr-3 md:table-cell">Location</th>
                <th className="py-2.5">Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.name}
                  className="border-b border-border-decorative/60 transition-colors last:border-0 hover:bg-canvas/50"
                >
                  <td className="py-3.5 pr-3">
                    <p className="font-bold text-ink">{r.name}</p>
                    <p className="text-xs text-text-secondary">{r.title}</p>
                  </td>
                  <td className="py-3.5 pr-3 text-text-secondary">{r.company}</td>
                  <td className="hidden py-3.5 pr-3 text-text-secondary md:table-cell">{r.location}</td>
                  <td className="py-3.5">
                    <Badge tone="honey">•••@{r.company.toLowerCase().replace(/[^a-z]+/g, "-")}.example</Badge>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-disabled">
                      <FeatureIcon name="grounding" size={12} />
                      {r.verification}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-text-disabled">
          Reveal shows the full address once, for one credit. Listing a contact never implies an active vacancy or
          consent to bulk outreach.
        </p>
      </PreviewPanel>

      <div className="mt-8 flex flex-wrap items-center gap-4" data-motion="reveal">
        <Link href="/sign-up">
          <Button variant="primary" size="lg">
            Explore contacts
          </Button>
        </Link>
        <p className="text-sm text-text-secondary">Search, filters, and masked emails are free to browse.</p>
      </div>
    </SectionShell>
  );
}
