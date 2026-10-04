"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, InlineError, Badge } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";
import { formatINRPaise } from "@/lib/format";

/**
 * CheckoutLauncher (§21): server-priced order → checkout modal. The sandbox
 * launcher is conspicuously labeled; the Razorpay script lazy-loads only on
 * purchase intent, when real keys are configured.
 */
export function CheckoutLauncher({ sku, priceLabel, salesLive }: { sku: string; priceLabel: string; salesLive: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"confirm" | "processing" | "done" | "pending">("confirm");

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/billing/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ sku }),
      });
      const data = (await res.json()) as {
        data?: { orderId: string; providerOrderId: string | null; amountPaise: number; mock: boolean };
        error?: { message?: string };
      };
      if (!res.ok || !data.data) throw new Error(data.error?.message ?? "Checkout could not start.");

      const { orderId, providerOrderId, amountPaise, mock } = data.data;

      if (mock) {
        // Sandbox: simulate a captured payment with a clearly labeled mock id.
        setStage("processing");
        const verify = await fetch(`/api/v1/billing/orders/${orderId}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpayOrderId: providerOrderId,
            razorpayPaymentId: `mock_pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`,
            razorpaySignature: "mock-signature-not-verified",
          }),
        });
        const verifyData = (await verify.json()) as { data?: { fulfilled: boolean }; error?: { message?: string } };
        if (!verify.ok || !verifyData.data) throw new Error(verifyData.error?.message ?? "Sandbox verification failed.");
        setStage("done");
        setTimeout(() => {
          setOpen(false);
          setStage("confirm");
          router.push(`/app/billing/payments/${orderId}`);
          router.refresh();
        }, 1200);
        return;
      }

      // Live Razorpay checkout: lazy-load the script only on purchase intent.
      setStage("processing");
      await loadRazorpayScript();
      const Razorpay = (window as unknown as { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      if (!Razorpay) throw new Error("Checkout failed to load. Disable blockers or try again.");
      void amountPaise;
      const rzp = new Razorpay({
        key: (window as unknown as { __rzpKeyId?: string }).__rzpKeyId ?? "",
        order_id: providerOrderId,
        name: "Apply Bee",
        description: "One-time credit pack",
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verify = await fetch(`/api/v1/billing/orders/${orderId}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          if (verify.ok) {
            setStage("done");
            setTimeout(() => router.push(`/app/billing/payments/${orderId}`), 800);
          } else {
            setStage("pending");
          }
        },
        modal: { ondismiss: () => { setStage("confirm"); setBusy(false); } },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setStage("confirm");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant={salesLive ? "accent" : "secondary"} onClick={() => setOpen(true)} className="mt-4 w-full">
        {salesLive ? "Choose" : "Sandbox checkout"}
      </Button>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} title="Confirm purchase">
        <div className="space-y-3 text-sm">
          {!salesLive ? (
            <Badge tone="warning">Sandbox checkout — no money moves, credits are simulated and labeled</Badge>
          ) : null}
          <p className="text-ink">
            Pack <strong>{sku}</strong> for <strong>{priceLabel}</strong> (one-time).
          </p>
          {stage === "done" ? (
            <p className="rounded-control bg-success-wash px-3 py-2 text-success" role="status">
              Payment confirmed — credits granted exactly once. Redirecting…
            </p>
          ) : stage === "pending" ? (
            <p className="rounded-control bg-warning-wash px-3 py-2 text-warning" role="status">
              Payment is being confirmed. Don’t pay again for this order — the order page shows live status.
            </p>
          ) : (
            <>
              {error ? <InlineError>{error}</InlineError> : null}
              <p className="text-text-secondary">
                Credits are granted when your payment is confirmed — usually within seconds. If confirmation is delayed,
                the payment page keeps trying; a captured payment is never lost.
              </p>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={busy && stage !== "processing"}>
              Cancel
            </Button>
            {stage !== "done" ? (
              <Button size="sm" onClick={startCheckout} disabled={busy}>
                {busy ? "Processing…" : `Pay ${priceLabel}`}
              </Button>
            ) : null}
          </div>
        </div>
      </Dialog>
    </>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Checkout failed to load. Disable blockers or try again."));
    document.head.appendChild(script);
  });
}

export { formatINRPaise };
