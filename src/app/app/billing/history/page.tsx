import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { listOrders, listPayments } from "@/server/services/billing";
import { Card, Badge, EmptyState } from "@/components/ui/primitives";
import { formatDateTime, formatINRPaise } from "@/lib/format";

export const metadata: Metadata = { title: "Payment history" };

const STATE_TONES: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  fulfilled: "success",
  captured: "success",
  pending: "warning",
  failed: "danger",
  created: "neutral",
  provider_created: "info",
};

export default async function BillingHistoryPage() {
  const user = await requireActiveUser();
  const [orders, payments] = await Promise.all([listOrders(user.id), listPayments(user.id)]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Payments</h2>
        <p className="text-sm text-text-secondary">
          Provider and local states shown plainly. A payment marked “being confirmed” should never be paid twice.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState art="credits" title="No purchases yet" description="One-time packs appear here when you buy them." />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const payment = payments.find((p) => p.orderId === o.id);
            const sku = o.skuSnapshot as { sku?: string; name?: string };
            const status = payment?.state ?? o.status;
            return (
              <Card key={o.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{sku.name ?? sku.sku}</p>
                    <p className="text-sm text-text-secondary">
                      {formatINRPaise(o.amountPaise)} · {formatDateTime(o.createdAt)}
                    </p>
                    <p className="text-xs text-text-disabled tabular">Order {o.receipt}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={STATE_TONES[status] ?? "neutral"}>
                      {status === "fulfilled" ? "Paid · credits granted" : status === "pending" ? "Being confirmed" : status}
                    </Badge>
                    <Link href={`/app/billing/payments/${o.id}`} className="text-sm font-semibold text-ink underline">
                      Details
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
