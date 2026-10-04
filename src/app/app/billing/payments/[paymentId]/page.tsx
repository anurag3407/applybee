import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { getOrderForUser } from "@/server/services/billing";
import { getBalances } from "@/server/services/credits";
import { Card, Badge } from "@/components/ui/primitives";
import { formatDateTime, formatINRPaise } from "@/lib/format";

export const metadata: Metadata = { title: "Payment" };

/**
 * Payment/order status (§21.4): polls durable fulfillment status — the
 * checkout flag is never authoritative. Accepts an order id (post-checkout
 * redirect) or a payment id.
 */
export default async function PaymentPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const user = await requireActiveUser();
  const { paymentId } = await params;
  const order = await getOrderForUser(user.id, paymentId);
  if (!order) notFound();
  const balances = await getBalances(user.id);
  const sku = order.skuSnapshot as { name?: string; sku?: string; contact_credits?: number; ai_credits?: number };

  const statusLabel =
    order.status === "fulfilled"
      ? "Paid — credits granted"
      : order.status === "pending"
        ? "Payment is being confirmed. Please don’t pay again for this order."
        : order.status === "cancelled"
          ? "Cancelled"
          : order.status === "failed"
            ? "Failed"
            : "Awaiting payment";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-text-secondary">
        <Link href="/app/billing/history" className="underline">Payments</Link> <span aria-hidden>/</span>{" "}
        <span className="tabular font-semibold text-ink">{order.receipt}</span>
      </nav>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">{sku.name ?? sku.sku}</h2>
            <p className="text-sm text-text-secondary">
              {formatINRPaise(order.amountPaise)} · {order.currency} · {formatDateTime(order.createdAt)}
            </p>
          </div>
          <Badge
            tone={order.status === "fulfilled" ? "success" : order.status === "pending" ? "warning" : "neutral"}
          >
            {statusLabel}
          </Badge>
        </div>
        {order.status === "fulfilled" ? (
          <div className="mt-4 rounded-control bg-success-wash px-3 py-2 text-sm text-success" role="status">
            Credits granted exactly once: {sku.contact_credits ?? 0} contact reveals and {sku.ai_credits ?? 0} AI
            generations. Current balances: {balances.contact.available} reveals · {balances.ai.available} AI.
          </div>
        ) : null}
        {order.providerOrderId ? (
          <p className="mt-3 text-xs text-text-disabled tabular">Provider order: {order.providerOrderId}</p>
        ) : null}
      </Card>

      <p className="text-xs text-text-disabled">
        Delays can happen if a provider confirmation is slow. Fulfillment is idempotent: whether confirmation arrives
        via callback, webhook, or reconciliation, credits are granted exactly once.
      </p>
    </div>
  );
}
