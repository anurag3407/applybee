import type { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/session";
import { getReviewableProfile, getProfileForUser } from "@/server/services/resumes";
import { ProfileFactsEditor } from "@/components/resumes/profile-facts-editor";
import { Badge, Card } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Career profile" };

export default async function ProfilePage() {
  const user = await requireActiveUser();
  const [reviewable, current] = await Promise.all([getReviewableProfile(user.id), getProfileForUser(user.id)]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Career profile</h2>
        <p className="text-sm text-text-secondary">
          AI drafts are written only from facts you have confirmed. Fix anything the parser got wrong.
        </p>
      </div>

      {reviewable && !reviewable.revision.approvedAt ? (
        <Card className="border-warning/40 bg-warning-wash/40">
          <p className="text-sm font-semibold text-warning">
            Parsed resume awaiting review — confirm or correct these facts to make them usable for AI.
          </p>
        </Card>
      ) : null}

      {reviewable ? (
        <ProfileFactsEditor
          revisionId={reviewable.revision.id}
          revisionNo={reviewable.revision.revisionNo}
          source={reviewable.revision.source}
          approved={Boolean(reviewable.revision.approvedAt)}
          extracted={reviewable.revision.extracted as { summary?: string | null; targetRole?: string | null } | null}
          facts={reviewable.facts.map((f) => ({
            id: f.id,
            factType: f.factType,
            text: f.text,
            approved: f.approved,
            sourceRef: f.sourceRef,
          }))}
        />
      ) : (
        <Card>
          <p className="text-sm text-text-secondary">
            No profile yet. Upload a resume or type facts manually — both end here for your review.
          </p>
        </Card>
      )}

      {current.revision && current.revision.id !== reviewable?.revision.id ? (
        <Card>
          <h3 className="font-bold text-ink">Current approved revision</h3>
          <p className="text-xs text-text-secondary">
            Revision {current.revision.revisionNo} · {current.revision.source} · approved {formatDate(current.revision.approvedAt)}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink">
            {current.facts.map((f) => (
              <li key={f.id} className="flex items-start gap-2">
                <Badge tone={f.approved ? "success" : "neutral"}>{f.factType}</Badge>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
