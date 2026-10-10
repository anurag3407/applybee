import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveUser } from "@/server/auth/session";
import { listSavedContacts } from "@/server/services/contacts";
import { SaveContactButton, WriteToContactButton } from "@/components/directory/reveal";
import { Badge, Card, Button } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Saved contacts" };

export default async function SavedPage() {
  const user = await requireActiveUser();
  const rows = await listSavedContacts(user.id);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Saved contacts</h2>
        <p className="text-sm text-text-secondary">Saving is free. Unavailable records stay visible as tombstones out of respect for history.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          art="saved"
          title="Nothing saved yet"
          description="Save contacts from the directory to keep them handy across your search."
          action={
            <Link href="/app/contacts">
              <Button variant="secondary">Find contacts</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <Card key={r.savedId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {r.tombstone ? (
                    <p className="font-bold text-ink">{r.name}</p>
                  ) : (
                    <Link href={`/app/contacts/${r.contactId}`} className="font-bold text-ink hover:underline">
                      {r.name}
                    </Link>
                  )}
                  <p className="text-sm text-text-secondary">
                    {r.title} · {r.companyName}
                  </p>
                  <p className="text-xs text-text-disabled">Saved {formatDate(r.savedAt)}</p>
                  {r.tombstone ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      This record is no longer available in the directory. Your unlock history is preserved; the address
                      was not removed from your account.
                    </p>
                  ) : null}
                </div>
                {!r.tombstone ? (
                  <div className="flex gap-2">
                    <SaveContactButton contactId={r.contactId} saved />
                    <WriteToContactButton contactId={r.contactId} />
                  </div>
                ) : (
                  <Badge>Unavailable</Badge>
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
