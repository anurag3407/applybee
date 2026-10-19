import { Badge } from "@/components/ui/primitives";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { GmailPreview } from "@/components/marketing/gmail-preview";

export function HeroScene() {
  return (
    <figure className="relative" data-motion="reveal">
      <figcaption className="sr-only">
        Interactive Gmail preview. Choose a message from the inbox, open it, and edit the example draft. No Gmail
        account is connected, and nothing is sent.
      </figcaption>

      <div
        aria-hidden
        className="absolute -inset-8 -z-10 bg-[radial-gradient(60%_60%_at_62%_38%,var(--ab-honey-wash),transparent_72%)] opacity-70 dark:opacity-40"
      />

      <div className="absolute -top-7 right-4 z-10">
        <Badge tone="honey">Interactive preview</Badge>
      </div>

      <GmailPreview />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <p className="flex items-center gap-2 text-[0.75rem] font-semibold text-ink">
          <FeatureIcon name="review" size={13} className="shrink-0 text-success" />
          Starts with 2 facts cited · 1 claim held back
        </p>
        <p className="text-[0.6875rem] leading-relaxed text-text-secondary">
          Demo only. Open a mail or edit the draft. No Gmail account is connected, and nothing is sent.
        </p>
      </div>
    </figure>
  );
}
