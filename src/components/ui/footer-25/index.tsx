'use client';

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";

export default function Footer25() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/public?kind=newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "Could not subscribe. Please try again.");
      }
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <footer className="relative flex min-h-[85vh] w-full flex-col justify-between overflow-hidden bg-surface dark:bg-black text-foreground dark:text-[#FAFAFA] border-t border-border-decorative dark:border-transparent font-sans antialiased selection:bg-foreground selection:text-background transition-colors">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img
          src="https://assets.watermelon.sh/footer-24.avif"
          alt="Vibrant Gradient Background"
          className="absolute inset-0 h-full w-full object-cover object-bottom opacity-20 dark:opacity-85 transition-opacity"
        />
        {/* Gradient overlay to smoothly transition the top into the vibrant bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface/85 to-transparent dark:from-black dark:via-black/70 dark:to-transparent transition-colors" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-between px-6 py-16 md:px-12 md:py-20 lg:py-24">
        
        {/* Top Section */}
        <div className="flex flex-col gap-14 md:flex-row md:justify-between lg:gap-24">
          <div
            data-reveal
            className="grid grid-cols-2 gap-x-10 gap-y-6 sm:gap-x-16"
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-400">Platform</span>
              <Link href="/how-it-works" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">How It Works</Link>
              <Link href="/features" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">Features</Link>
              <Link href="/pricing" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">Pricing</Link>
              <Link href="/faq" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">FAQ</Link>
              <Link href="/app" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">Workspace</Link>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-400">Trust & Legal</span>
              <Link href="/security" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">Security</Link>
              <Link href="/help" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">Help & Docs</Link>
              <Link href="/legal/privacy" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">Privacy</Link>
              <Link href="/accessibility" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">Accessibility</Link>
              <Link href="/contact-data/request" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">Data Request</Link>
              <Link href="/contact" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70 text-foreground dark:text-[#FAFAFA]">Contact</Link>
            </div>
          </div>

          <div
            data-reveal
            className="flex w-full max-w-sm flex-col md:max-w-md [--ab-reveal-delay:0.1s]"
          >
            <p className="mb-8 text-xl text-foreground dark:text-zinc-200 md:text-2xl">
              Get career outreach strategies, hiring manager insights, and AI workflow tips straight to your inbox.
            </p>
            {subscribed ? (
              <div className="rounded-control bg-success-wash border border-success/30 p-4 text-sm text-success">
                ✓ Thank you for subscribing! We&apos;ll deliver actionable outreach guides and updates.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative flex items-center justify-between border-b border-border dark:border-white/20 pb-4 transition-colors focus-within:border-foreground dark:focus-within:border-white">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  disabled={submitting}
                  className="w-full bg-transparent text-lg text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-zinc-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  aria-label="Subscribe"
                  className="text-muted-foreground dark:text-zinc-400 transition-colors hover:text-foreground dark:hover:text-white cursor-pointer disabled:opacity-50"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-6" />
                </button>
              </form>
            )}
            {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
          </div>
        </div>

        {/* Middle Section (Socials) */}
        <div
          data-reveal
          className="mt-16 mb-12 flex items-center justify-between [--ab-reveal-y:0px] [--ab-reveal-dur:1s] [--ab-reveal-delay:0.2s]"
        >
          {/* Horizontal line extending from the left */}
          <div className="hidden h-px flex-1 bg-border dark:bg-white/20 md:block md:mr-16 lg:mr-32" />
          
          <div className="flex w-full flex-wrap items-center justify-between gap-6 md:w-auto md:justify-end sm:gap-8 lg:gap-12">
            {[
              { label: "TWITTER / X", href: "https://x.com" },
              { label: "LINKEDIN", href: "https://linkedin.com" },
              { label: "GITHUB", href: "https://github.com" },
              { label: "CONTACT US", href: "/contact" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-muted-foreground dark:text-zinc-200 transition-colors hover:text-foreground dark:hover:text-white sm:text-sm"
              >
                {social.label}
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Section (Massive Logo) */}
        <div
          data-reveal
          className="mt-auto mb-8 w-full [--ab-reveal-y:40px] [--ab-reveal-dur:1.2s] [--ab-reveal-delay:0.3s]"
        >
          <svg 
            viewBox="0 0 1200 200" 
            className="h-auto w-full fill-current text-foreground/85 dark:text-white transition-colors" 
            aria-hidden="true"
            preserveAspectRatio="xMidYMid meet"
          >
            <text 
              x="50%" 
              y="160" 
              textAnchor="middle"
              fontSize="180" 
              fontWeight="900" 
              fontFamily="inherit" 
              letterSpacing="-0.04em"
            >
              REACHBEE
            </text>
          </svg>
          <h1 className="sr-only">ReachBee</h1>
        </div>

        {/* Footer Meta */}
        <div
          data-reveal
          className="flex flex-col items-start justify-between gap-6 text-foreground dark:text-white md:flex-row md:items-end border-t border-border dark:border-white/10 pt-6 transition-colors [--ab-reveal-y:0px] [--ab-reveal-dur:1s] [--ab-reveal-delay:0.5s]"
        >
          <p className="max-w-2xl leading-relaxed text-xs sm:text-sm text-muted-foreground dark:text-zinc-400">
            © {new Date().getFullYear()} ReachBee AI. Direct career outreach workspace beyond saturated job portals. <br />
            ReachBee never sends emails without your explicit approval. Gmail drafts are staged for you to review and send.
          </p>
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 whitespace-nowrap text-xs sm:text-sm font-medium text-muted-foreground dark:text-zinc-300">
            <Link href="/security" className="transition-colors hover:text-foreground dark:hover:text-white">Security</Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-foreground dark:hover:text-white">Privacy Policy</Link>
            <Link href="/legal/terms" className="transition-colors hover:text-foreground dark:hover:text-white">Terms of Service</Link>
            <Link href="/legal/contact-data" className="transition-colors hover:text-foreground dark:hover:text-white">Contact Data</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

export { Footer25 };
