import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingMotion } from "@/components/marketing/motion";
import { getSessionUser } from "@/server/auth/session";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser().catch(() => null);
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <MarketingHeader signedIn={Boolean(user)} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
      <MarketingMotion />
    </div>
  );
}
