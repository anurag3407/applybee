import Link from "next/link";
import { Wordmark } from "@/components/marketing/brand";
import { Badge } from "@/components/ui/primitives";

/**
 * Branded auth framing (§11.3): centered 440 px card with a quiet side panel.
 * No scroll animation, no scene motion.
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
          <div className="w-full max-w-[27.5rem]">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-6 text-sm text-text-secondary">{footer}</div> : null}
            <p className="mt-8 text-xs leading-relaxed text-text-disabled">
              By continuing you agree to our{" "}
              <Link href="/legal/terms" className="underline">terms</Link> and{" "}
              <Link href="/legal/privacy" className="underline">privacy policy</Link>.
            </p>
          </div>
        </div>
      </div>
      <aside className="on-ink hidden flex-col justify-center bg-ink px-12 text-surface lg:flex" aria-hidden>
        <div className="max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-honey">Apply Bee</p>
          <p className="mt-4 text-3xl font-bold leading-snug">
            Find the right person. Write something true. Review it before anything happens.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/75">
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-honey" />
              Relevant hiring contacts with honest verification labels
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-honey" />
              Introductions grounded in facts you confirmed
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-honey" />
              Gmail drafts only after your explicit approval — sending stays yours
            </li>
          </ul>
          <div className="mt-8">
            <Badge tone="honey">You send it yourself. Always.</Badge>
          </div>
        </div>
      </aside>
    </div>
  );
}
