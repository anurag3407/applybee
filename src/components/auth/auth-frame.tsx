import Link from "next/link";
import { Wordmark } from "@/components/marketing/brand";
import { CombField } from "@/components/svg/meter";
import { OutreachPath } from "@/components/svg/composite";
import { IconDraft, IconRadar, IconSend } from "@/components/svg/icons";
import { Reveal } from "@/components/motion";

/**
 * Branded auth framing (§11.3): centered 440 px card with a quiet side panel.
 * The panel carries the brand's own honeycomb geometry and the real three-hop
 * path the product performs — no stock scene motion.
 */
export function AuthFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8">
        <Wordmark />
        <div className="flex flex-1 items-center justify-center">
          <Reveal className="w-full max-w-[27.5rem]" y={10}>
            <h1 className="text-[1.75rem] font-extrabold tracking-tight text-ink">{title}</h1>
            <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-6 text-sm text-text-secondary">{footer}</div> : null}
            <p className="mt-8 text-xs leading-relaxed text-text-disabled">
              By continuing you agree to our{" "}
              <Link href="/legal/terms" className="underline">terms</Link> and{" "}
              <Link href="/legal/privacy" className="underline">privacy policy</Link>.
            </p>
          </Reveal>
        </div>
      </div>

      <aside className="brand-panel on-ink relative hidden flex-col justify-center overflow-hidden bg-ink px-12 text-surface lg:flex" aria-hidden>
        <CombField
          className="absolute inset-y-0 right-[-4rem] h-full w-[22rem] opacity-[0.13]"
          rows={12}
          cols={9}
        />
        <div className="relative max-w-md">
          <Wordmark className="text-surface" label="ReachBee" href="/features" />
          <p className="mt-6 text-[1.75rem] font-bold leading-snug tracking-tight">
            Find the right person. Write something true. Review it before anything happens.
          </p>
          <ul className="mt-7 space-y-3.5 text-sm text-surface/80">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <svg width="14" height="16" viewBox="0 0 14 16" className="mt-[3px] shrink-0">
                  <path
                    d="M7 1.2l5.4 3.1v7.4L7 14.8l-5.4-3.1V4.3z"
                    fill="var(--ab-honey-wash)"
                    stroke="var(--ab-honey)"
                    strokeWidth="1.2"
                  />
                </svg>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-9 rounded-card border border-surface/15 bg-surface/[0.06] p-4">
            <p className="mb-2.5 text-xs font-bold text-surface/70">What happens after you sign in</p>
            <OutreachPath
              className="text-surface"
              steps={[
                { label: "Find a contact", icon: <IconRadar size={13} /> },
                { label: "Ground a draft", icon: <IconDraft size={13} /> },
                { label: "Stage in Gmail", icon: <IconSend size={13} /> },
              ]}
            />
          </div>
          <div className="mt-6">
            {/* Solid honey: the wash variant is dark-on-dark on this panel. */}
            <span className="inline-flex items-center rounded-pill bg-honey px-3 py-1.5 text-xs font-bold text-on-honey">
              You send it yourself. Always.
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

const PROMISES = [
  "Relevant hiring contacts with honest verification labels",
  "Introductions grounded in facts you confirmed",
  "Gmail drafts only after your explicit approval. Sending stays yours",
];
