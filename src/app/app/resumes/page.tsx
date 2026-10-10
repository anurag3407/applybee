import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { listResumes } from "@/server/services/resumes";
import { getConfig } from "@/server/config";
import { UploadZone } from "@/components/resumes/upload-zone";
import { DeleteResumeButton } from "@/components/resumes/delete-resume";
import { Badge, Card, StatusChip } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Resumes" };

const STATE_LABELS: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }> = {
  uploaded: { label: "Uploaded, queued for scan", tone: "info" },
  scanning: { label: "Scanning", tone: "info" },
  scanning_rejected: { label: "Rejected by scan", tone: "danger" },
  parsing: { label: "Parsing", tone: "info" },
  review_required: { label: "Review parsed facts", tone: "warning" },
  ready: { label: "Ready", tone: "success" },
  parse_failed: { label: "Parse failed", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
};

export default async function ResumesPage() {
  const user = await requireActiveUser();
  const [resumes, config] = await Promise.all([listResumes(user.id), import("@/server/config").then((m) => m.getConfig())]);
  const scannerReal = Boolean(config.DOCUMENT_PROCESSOR_ENDPOINT);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Resumes</h2>
        <p className="text-sm text-text-secondary">
          Private storage, scan-gated, owner-only downloads. Files are never publicly linkable. PDF up to 5 MiB, 10 pages, 3
          active files.
        </p>
      </div>

      <UploadZone />

      {resumes.length === 0 ? (
        <EmptyState art="resume" title="No resumes" description="Upload a PDF or enter your profile manually. Both paths end in facts you confirm." />
      ) : (
        <ul className="space-y-3">
          {resumes.map((r) => {
            const state = STATE_LABELS[r.state] ?? { label: r.state, tone: "neutral" as const };
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/app/resumes/${r.id}`} className="font-bold text-ink hover:underline">
                      {r.displayFilename}
                    </Link>
                    <p className="text-xs text-text-secondary">
                      {(r.byteSize / 1024 / 1024).toFixed(2)} MiB{r.pageCount ? ` · ${r.pageCount} pages` : ""} · uploaded {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={state.tone} label={state.label} />
                    <DeleteResumeButton resumeId={r.id} />
                  </div>
                </div>
                {r.scanNote ? <p className="mt-2 text-xs text-text-disabled">{r.scanNote}</p> : null}
              </Card>
            );
          })}
        </ul>
      )}

      {!scannerReal ? (
        <Card className="border-warning/40">
          <Badge tone="warning">Local development scanner</Badge>
          <p className="mt-2 text-sm text-text-secondary">
            Files receive structural validation only (magic bytes, encryption, page limits). Production deployments
            require the isolated document processor with current antivirus signatures before any attachment use, this
            is a launch gate, not an option. Attachment delivery in this environment is clearly labeled sandbox
            behavior.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

export const dynamic = "force-dynamic";
