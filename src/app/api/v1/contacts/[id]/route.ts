import { getSessionUser } from "@/server/auth/session";
import { getContactForUser } from "@/server/services/contacts";
import { ok, errorResponse } from "@/server/http";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return errorResponse(new Error("UNAUTHORIZED"));
    const { id } = await params;
    const contact = await getContactForUser(user.id, id);
    if (!contact) return errorResponse(new Error("NOT_FOUND"));
    // Email only with unlock (§3.2).
    return ok({
      id: contact.id,
      name: contact.name,
      title: contact.title,
      roleCategory: contact.roleCategory,
      location: contact.location,
      profileUrl: contact.profileUrl,
      companyName: contact.companyName,
      companyDomain: contact.companyDomain,
      companyStage: contact.companyStage,
      verificationStatus: contact.verificationStatus,
      status: contact.status,
      lastEmailCheckedAt: contact.lastEmailCheckedAt,
      employmentCheckedAt: contact.employmentCheckedAt,
      unlocked: contact.unlocked,
      email: contact.email,
      maskedEmail: contact.maskedEmail,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
