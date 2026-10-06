import { ClerkScope } from "@/components/auth/clerk-scope";

/**
 * Auth routes are the only pages that render Clerk client components
 * (GoogleAuthButton's `useClerk`). Server-side session resolution is handled
 * by `clerkMiddleware` in src/proxy.ts, so the provider is scoped here instead
 * of the root layout — public pages ship no Clerk client code.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <ClerkScope>{children}</ClerkScope>;
}
