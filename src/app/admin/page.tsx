import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { requireAdmin } from "@/server/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, Badge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Admin health" };

export default async function AdminHome() {
  await requireAdmin();
  const [queue, gmailUncertain, paymentsPending, reports, consistency] = await Promise.all([
    db.execute(sql`SELECT state, count(*)::int AS c FROM jobs WHERE state IN ('queued','running','retry_wait','deferred','failed','needs_attention') GROUP BY state`),
    db.execute(sql`SELECT count(*)::int AS c FROM gmail_deliveries WHERE state IN ('unknown','reconciling','needs_confirmation')`),
    db.execute(sql`SELECT count(*)::int AS c FROM payment_orders WHERE status IN ('pending','provider_created') AND created_at < now() - interval '5 minutes'`),
    db.execute(sql`SELECT count(*)::int AS c FROM contact_reports WHERE state = 'open'`),
    db.execute(sql`SELECT count(*)::int AS c FROM verify_credit_consistency()`),
  ]);

  const jobStates = queue.rows as Array<{ state: string; c: number }>;
  const uncertainGmail = Number((gmailUncertain.rows[0] as { c: number }).c);
  const pendingPayments = Number((paymentsPending.rows[0] as { c: number }).c);
  const openReports = Number((reports.rows[0] as { c: number }).c);
  const creditIssues = Number((consistency.rows[0] as { c: number }).c);

  return (
    <AdminShell title="Operational health">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Credit consistency issues" value={creditIssues} critical={creditIssues > 0} href="/admin/jobs" />
        <MetricCard label="Uncertain Gmail outcomes" value={uncertainGmail} critical={uncertainGmail > 3} href="/admin/jobs" />
        <MetricCard label="Payments unfulfilled > 5 min" value={pendingPayments} critical={pendingPayments > 0} href="/admin/payments" />
        <MetricCard label="Open contact reports" value={openReports} critical={false} href="/admin/reports" />
      </div>

      <Card className="mt-5">
        <h3 className="font-bold text-ink">Job queue by state</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {jobStates.length === 0 ? <Badge>Queue empty</Badge> : null}
          {jobStates.map((s) => (
            <Badge key={s.state} tone={s.state === "failed" || s.state === "needs_attention" ? "danger" : s.state === "running" ? "info" : "neutral"}>
              {s.state}: {s.c}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-disabled">
          Any double grant, negative balance, or ledger mismatch is a critical alert: disable affected money mutations
          and reconcile before re-enabling (§29.3).
        </p>
      </Card>
    </AdminShell>
  );
}

function MetricCard({ label, value, critical, href }: { label: string; value: number; critical: boolean; href: string }) {
  return (
    <a href={href} className="block">
      <Card className={critical ? "border-danger/40" : ""}>
        <p className="text-xs font-bold uppercase tracking-wide text-text-disabled">{label}</p>
        <p className={`mt-1 text-3xl font-bold tabular ${critical ? "text-danger" : "text-ink"}`}>{value}</p>
        {critical ? <Badge tone="danger">Action needed</Badge> : <Badge tone="success">OK</Badge>}
      </Card>
    </a>
  );
}
