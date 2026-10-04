"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";

export function GoogleAuthButton({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const clerk = useClerk();

  async function handleGoogle() {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!clerk.loaded) {
        await new Promise<void>((resolve) => {
          const unsub = clerk.addListener(() => {
            if (clerk.loaded) {
              unsub();
              resolve();
            }
          });
        });
      }

      const client = clerk.client;
      if (!client) {
        throw new Error("Clerk authentication client not ready");
      }

      const target = mode === "sign-up" ? client.signUp : client.signIn;
      await target.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/app",
      });
      return;
    } catch (err: unknown) {
      console.error("Google authentication error:", err);
      // If sign-in failed (e.g. user does not have an account yet), attempt sign-up
      if (mode === "sign-in" && clerk.client) {
        try {
          await clerk.client.signUp.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: "/sso-callback",
            redirectUrlComplete: "/app",
          });
          return;
        } catch (signUpErr) {
          console.error("Google sign-up fallback error:", signUpErr);
        }
      }
      setErrorMsg("Google authentication could not be completed. Please try again or use direct email.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-3 rounded-control border border-border-control bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-xs transition hover:bg-surface-subtle active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        {loading ? "Connecting to Google…" : "Continue with Google"}
      </button>
      {errorMsg ? (
        <p className="text-center text-xs text-danger" role="alert">
          {errorMsg}
        </p>
      ) : null}
    </div>
  );
}
