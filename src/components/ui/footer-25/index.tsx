'use client';

import Link from "next/link";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";

export default function Footer25() {
  return (
    <footer className="relative flex min-h-[85vh] w-full flex-col justify-between overflow-hidden bg-black text-[#FAFAFA] font-sans antialiased selection:bg-[#FAFAFA] selection:text-black">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://assets.watermelon.sh/footer-24.avif"
          alt="Vibrant Gradient Background"
          className="absolute inset-0 h-full w-full object-cover object-bottom opacity-85"
        />
        {/* Gradient overlay to smoothly transition the black top into the vibrant bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-transparent" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-between px-6 py-16 md:px-12 md:py-20 lg:py-24">
        
        {/* Top Section */}
        <div className="flex flex-col gap-14 md:flex-row md:justify-between lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 gap-x-10 gap-y-6 sm:gap-x-16"
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Platform</span>
              <Link href="/#how-it-works" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70">How It Works</Link>
              <Link href="/#features" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70">Features</Link>
              <Link href="/pricing" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70">Pricing</Link>
              <Link href="/app" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70">Workspace</Link>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Trust & Legal</span>
              <Link href="/security" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70">Security</Link>
              <Link href="/help" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70">Help & Docs</Link>
              <Link href="/legal/privacy" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70">Privacy</Link>
              <Link href="/contact" className="text-2xl sm:text-3xl font-semibold tracking-tight transition-opacity hover:opacity-70">Contact</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex w-full max-w-sm flex-col md:max-w-md"
          >
            <p className="mb-8 text-xl text-zinc-200 md:text-2xl">
              Get career outreach strategies, hiring manager insights, and AI workflow tips straight to your inbox.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="relative flex items-center justify-between border-b border-white/20 pb-4 transition-colors focus-within:border-white">
              <input
                type="email"
                placeholder="Email address"
                required
                className="w-full bg-transparent text-lg text-white placeholder-zinc-500 outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="text-zinc-400 transition-colors hover:text-white cursor-pointer"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-6" />
              </button>
            </form>
          </motion.div>
        </div>

        {/* Middle Section (Socials) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 mb-12 flex items-center justify-between"
        >
          {/* Horizontal line extending from the left */}
          <div className="hidden h-px flex-1 bg-white/20 md:block md:mr-16 lg:mr-32" />
          
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
                className="group flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-zinc-200 transition-colors hover:text-white sm:text-sm"
              >
                {social.label}
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Bottom Section (Massive Logo) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-auto mb-8 w-full"
        >
          <svg 
            viewBox="0 0 1200 200" 
            className="h-auto w-full fill-current text-white" 
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
        </motion.div>

        {/* Footer Meta */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start justify-between gap-6 text-white md:flex-row md:items-end border-t border-white/10 pt-6"
        >
          <p className="max-w-2xl leading-relaxed text-xs sm:text-sm text-zinc-400">
            © {new Date().getFullYear()} ReachBee AI. Direct career outreach workspace beyond saturated job portals. <br />
            ReachBee never sends emails without your explicit approval. Gmail drafts are staged for you to review and send.
          </p>
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 whitespace-nowrap text-xs sm:text-sm font-medium text-zinc-300">
            <Link href="/security" className="transition-colors hover:text-white">Security</Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link href="/legal/terms" className="transition-colors hover:text-white">Terms of Service</Link>
            <Link href="/legal/contact-data" className="transition-colors hover:text-white">Contact Data</Link>
          </div>
        </motion.div>

      </div>
    </footer>
  );
}

export { Footer25 };
