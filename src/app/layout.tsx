import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { site } from "@/lib/seo";
import "@/styles/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || site.url),
  title: {
    default: "ReachBee AI, Direct Outreach Beyond Saturated Job Portals",
    template: "%s · ReachBee",
  },
  description:
    "Find verified engineering decision-makers, ground your proven technical achievements into bespoke introductions without hallucination, and stage drafts directly into your personal Gmail.",
  applicationName: "ReachBee",
  // The share card is what a link looks like in WhatsApp, LinkedIn and Slack —
  // without an image here those previews fall back to a bare title.
  openGraph: {
    siteName: "ReachBee AI",
    title: "ReachBee AI",
    description: "Direct outreach beyond saturated job portals.",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "ReachBee AI — direct outreach beyond saturated job portals" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReachBee AI",
    description: "Direct outreach beyond saturated job portals.",
    images: ["/og.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
                try {
                  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    document.documentElement.classList.add('js-reveal');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:shadow-card">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
