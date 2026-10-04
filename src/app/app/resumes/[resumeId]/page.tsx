import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/server/auth/session";
import { getResume } from "@/server/services/resumes";
import { Badge, Card, StatusChip } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";
import { DeleteResumeButton } from "@/components/resumes/delete-resume";
import { DownloadResumeButton } from "@/components/resumes/download-resume";

export const metadata: Metadata = { title: "Resume" };

export default async function ResumeDetailPage({ params }: { params: Promise<{ resumeId: string }> }) {
  const user = await requireActiveUser();
  const { resumeId } = await params;
  const resume = await getResume(user.id, resumeId);
  if (!resume) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-text-secondary">
        <Link href="/app/resumes" className="underline">Resumes</Link> <span aria-hidden>/</span>{" "}
        <span className="font-semibold text-ink">{resume.displayFilename}</span>
      </nav>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">{resume.displayFilename}</h2>
            <p className="text-sm text-text-secondary">
              {(resume.byteSize / 1024 / 1024).toFixed(2)} MiB
              {resume.pageCount ? ` · ${resume.pageCount} pages` : ""} · uploaded {formatDate(resume.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DownloadResumeButton
              resumeId={resume.id}
              filename={resume.displayFilename}
              disabled={resume.scanStatus !== "clean"}
            />
            <DeleteResumeButton resumeId={resume.id} />
          </div>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-text-secondary">State:</dt>
            <dd><Badge>{resume.state}</Badge></dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-text-secondary">Scan:</dt>
            <dd>
              <StatusChip
                status={resume.scanStatus === "clean" ? "success" : resume.scanStatus === "rejected" ? "danger" : "warning"}
                label={resume.scanStatus}
              />
            </dd>
          </div>
          {resume.scanNote ? <p className="text-xs text-text-disabled">{resume.scanNote}</p> : null}
          <div className="flex items-center gap-2">
            <dt className="text-text-secondary">Parse:</dt>
            <dd><Badge>{resume.parseState}</Badge></dd>
          </div>
        </dl>
      </Card>
      {resume.state === "review_required" ? (
        <Card className="border-honey">
          <p className="text-sm font-semibold text-ink">Next step: review the parsed facts</p>
          <Link href="/app/profile" className="mt-2 inline-block text-sm font-bold text-ink underline">
            Open career profile
          </Link>
        </Card>
      ) : null}
      <Card>
        <h3 className="text-sm font-bold text-ink">Safe downloads</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Downloads require your signed-in session and an ownership check on the server, are scan-gated, and are never
          publicly linkable. A file must be scan-clean before it can be downloaded or attached to a draft.
        </p>
      </Card>
    </div>
  );
}
