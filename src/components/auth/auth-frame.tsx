import Link from "next/link";
import { Wordmark } from "@/components/marketing/brand";
import { Reveal } from "@/components/motion";

/**
 * Branded auth framing (§11.3): a quiet form column and one dark editorial
 * panel. The panel states the product contract rather than decorating it —
 * no stock scene, no second logo, no inner card.
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
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Wordmark />
        <div className="flex flex-1 items-center justify-center py-12">
          <Reveal className="w-full max-w-[26rem]" y={10}>
            <p className="text-[0.75rem] font-semibold text-text-secondary">Your career workspace</p>
            <h1 className="mt-2 text-[2rem] font-extrabold leading-[1.1] tracking-[-0.035em] text-ink">{title}</h1>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-text-secondary">{subtitle}</p>
            <div className="mt-7">{children}</div>
            {footer ? <div className="mt-6 text-[0.875rem] text-text-secondary">{footer}</div> : null}
            <p className="mt-8 text-[0.75rem] leading-relaxed text-text-disabled">
              By continuing you agree to our{" "}
              <Link href="/legal/terms" className="underline decoration-border-control/70 underline-offset-2">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="underline decoration-border-control/70 underline-offset-2">
                privacy policy
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </div>

      <aside
        className="brand-panel on-ink relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-surface lg:flex"
        aria-hidden
      >
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-surface/70">
          The outreach standard
        </p>
        <div className="max-w-[30rem]">
          <p className="text-[2rem] font-extrabold leading-[1.2] tracking-[-0.035em] text-surface">
            Find the right person. Write something true. Review it before anything happens.
          </p>
          <ul className="mt-10 border-t border-surface/15">
            {PROMISES.map((promise, i) => (
              <li key={promise} className="flex items-baseline gap-4 border-b border-surface/15 py-4">
                <span className="tabular text-[0.6875rem] font-semibold text-honey">0{i + 1}</span>
                <span className="text-[0.875rem] leading-relaxed text-surface/85">{promise}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="flex items-center gap-3 text-[0.8125rem] text-surface/70">
          <span aria-hidden className="h-1.5 w-1.5 bg-honey" />
          You send it yourself. Always.
        </p>
      </aside>
    </div>
  );
}

const PROMISES = [
  "Relevant hiring contacts with honest verification labels.",
  "Introductions grounded in facts you confirmed.",
  "Gmail drafts only after your explicit approval. Sending stays yours.",
];
