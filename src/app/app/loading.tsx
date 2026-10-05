import { SplashScreen } from "@/components/ui/splash-screen";

export default function AppLoading() {
  return (
    <SplashScreen
      fullScreen={false}
      title="Loading workspace"
      subtitle="Fetching leads, drafts, and campaign telemetry..."
      className="min-h-[60vh]"
    />
  );
}
