import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ReachBee AI — Direct Outreach Beyond Saturated Job Portals",
    template: "%s · ReachBee",
  },
  description:
    "Find verified engineering decision-makers, ground your proven technical achievements into bespoke introductions without hallucination, and stage drafts directly into your personal Gmail.",
  openGraph: {
    title: "ReachBee AI",
    description: "Verified engineering decision-makers. Grounded introductions. You review before sending.",
    type: "website",
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
  const content = (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:shadow-card">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );

  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (clerkKey) {
    return <ClerkProvider publishableKey={clerkKey}>{content}</ClerkProvider>;
  }
  return content;
}
