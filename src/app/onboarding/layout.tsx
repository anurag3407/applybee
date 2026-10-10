import type { Metadata } from "next";
import { noIndexMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = noIndexMeta;

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
