import "server-only";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  companies,
  contacts,
  digestDispatches,
  hiringPosts,
  userPreferences,
  users,
} from "@/db/schema";
import { logger } from "@/server/logger";
import { getConfig } from "@/server/config";
import { sendEmail, escapeHtml, type SendEmailResult } from "@/server/services/email";
import { getBalances } from "@/server/services/credits";

export type DigestHiringPost = {
  id: string;
  title: string;
  companyName: string;
  location: string | null;
  roleCategory: string;
  department: string;
  sourcePlatform: string;
  sourceUrl: string | null;
  postSnippet: string;
  techStack: string[];
  hiringManagerName: string | null;
  hiringManagerTitle: string | null;
  contactId?: string | null;
  companyId?: string | null;
  /** Real verification state from the directory, when this maps to a contact. */
  verificationStatus?: string | null;
  postedAt: Date;
};

/* ------------------------------------------------------------------ */
/* Initial Seed Catalog for Fresh Hiring Posts                        */
/* ------------------------------------------------------------------ */

const INITIAL_CURATED_POSTS = [
  // Sample content only. These are deliberately fictional companies and people,
  // matching the rest of the seed data.
  //
  // The earlier version of this list named real companies and real, named
  // executives with invented job openings. It was emailed to every opted-in user
  // every morning, which meant fabricating hiring claims about identifiable
  // people — indefensible for a product whose entire pitch is truthful contact
  // data. Replace with licensed, real listings before enabling the digest in
  // production (see docs/implementation-status.md, "licensed contact data").
  {
    title: "Founding Full-Stack Engineer",
    companyName: "Northwind Labs",
    location: "Remote (Global)",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. A small team building internal developer tooling, shipping weekly with a very short feedback loop.",
    techStack: ["TypeScript", "PostgreSQL", "React"],
    hiringManagerName: "Alex Moreau",
    hiringManagerTitle: "Co-founder",
  },
  {
    title: "Senior Backend Engineer (Distributed Systems)",
    companyName: "Riverbend Systems",
    location: "Bengaluru, India / Hybrid",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. Event-driven order processing with strict consistency guarantees and heavy PostgreSQL concurrency.",
    techStack: ["Go", "PostgreSQL", "Kafka"],
    hiringManagerName: "Priya Raman",
    hiringManagerTitle: "VP Engineering",
  },
  {
    title: "Platform Engineer (Developer Experience)",
    companyName: "Lumengrid",
    location: "Remote (Global)",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. Owning build tooling, CI, and the paved road that keeps dozens of engineers unblocked.",
    techStack: ["Bazel", "Go", "Kubernetes"],
    hiringManagerName: "Marcus Feld",
    hiringManagerTitle: "Head of Platform",
  },
  {
    title: "Frontend Engineer (Design Systems)",
    companyName: "Cartwheel",
    location: "Bengaluru, India",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. Component libraries and accessibility work on a consumer product with strict performance budgets.",
    techStack: ["React", "TypeScript", "Tailwind CSS"],
    hiringManagerName: "Dana Whitfield",
    hiringManagerTitle: "Director of Design",
  },
  {
    title: "AI Application Engineer",
    companyName: "Foundry Health",
    location: "Remote (Global)",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. Retrieval-augmented assistants over de-identified documentation, with human review on every output.",
    techStack: ["Python", "LLMs", "FastAPI"],
    hiringManagerName: "Omar Haddad",
    hiringManagerTitle: "Head of AI",
  },
  {
    title: "Staff Infrastructure Engineer",
    companyName: "Blue Harbour",
    location: "Bengaluru, India / Hybrid",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. Multi-region Kubernetes and observability work for a high-traffic payments platform.",
    techStack: ["Kubernetes", "Go", "Terraform"],
    hiringManagerName: "Sofia Bergström",
    hiringManagerTitle: "Principal Engineer",
  },
  {
    title: "Founding Engineer (Agentic Workflows)",
    companyName: "Sable Studio",
    location: "Remote (Global)",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. You would own an entire product surface, from data model through deployment, in a team of three.",
    techStack: ["TypeScript", "PostgreSQL", "LLMs"],
    hiringManagerName: "Jordan Okafor",
    hiringManagerTitle: "Founder",
  },
  {
    title: "Senior Engineer (Payments Core)",
    companyName: "Kettle Payments",
    location: "Bengaluru, India",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. Ledger and settlement correctness, double-entry accounting, and reconciliation tooling.",
    techStack: ["Java", "Kotlin", "PostgreSQL"],
    hiringManagerName: "Mei Lin",
    hiringManagerTitle: "Engineering Manager",
  },
  {
    title: "Backend Engineer (Realtime)",
    companyName: "Sundial",
    location: "Remote (Global)",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. WebSocket fan-out and presence for a collaboration product used by distributed teams.",
    techStack: ["Rust", "WebSockets", "Redis"],
    hiringManagerName: "Tomas Vidal",
    hiringManagerTitle: "Staff Engineer",
  },
  {
    title: "Full-Stack Engineer (Growth)",
    companyName: "Copperleaf",
    location: "Remote (Global)",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. Fast experimentation on onboarding flows, with direct ownership of the metrics that follow.",
    techStack: ["React", "TypeScript", "PostgreSQL"],
    hiringManagerName: "Aisha Bello",
    hiringManagerTitle: "Head of Growth",
  },
  {
    title: "Full-Stack Engineer (Experimentation)",
    companyName: "Meridian Analytics",
    location: "Remote (Global)",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. Experimenting on onboarding and activation flows, with direct ownership of the metrics that follow.",
    techStack: ["React", "TypeScript", "PostgreSQL"],
    hiringManagerName: "Yuki Tanaka",
    hiringManagerTitle: "Head of Product",
  },
  {
    title: "AI Systems & Inference Engineer",
    companyName: "Vector Foundry",
    location: "Remote (Global)",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Sample listing. Optimising inference kernels and low-latency serving for retrieval workloads.",
    techStack: ["Python", "PyTorch", "LLMs"],
    hiringManagerName: "Rafael Costa",
    hiringManagerTitle: "Co-Founder",
  },
];

/**
 * Seed initial hiring posts if table is empty or low.
 *
 * NOTE: this only inserts when the table holds fewer than 10 rows. It does not
 * replace existing content. If you seeded before the fictional-company change,
 * clear `hiring_posts` once (`TRUNCATE hiring_posts;`) so the fabricated
 * real-company listings stop being emailed.
 */
export async function seedInitialHiringPostsIfEmpty(): Promise<number> {
  const existing = await db.execute(sql`SELECT count(*) as c FROM hiring_posts`);
  const count = Number((existing.rows[0] as { c: string })?.c ?? 0);
  if (count >= 10) return 0;

  let inserted = 0;
  for (const post of INITIAL_CURATED_POSTS) {
    await db.insert(hiringPosts).values({
      title: post.title,
      companyName: post.companyName,
      location: post.location,
      roleCategory: post.roleCategory,
      department: post.department,
      sourcePlatform: post.sourcePlatform,
      sourceUrl: post.sourceUrl,
      postSnippet: post.postSnippet,
      techStack: post.techStack,
      hiringManagerName: post.hiringManagerName,
      hiringManagerTitle: post.hiringManagerTitle,
      status: "active",
      postedAt: new Date(Date.now() - Math.floor(Math.random() * 24) * 3600 * 1000),
    });
    inserted++;
  }
  return inserted;
}

/* ------------------------------------------------------------------ */
/* Candidate Matching & Post Selection                                */
/* ------------------------------------------------------------------ */

export async function getDigestPostsForUser(userId: string, limit = 10): Promise<DigestHiringPost[]> {
  await seedInitialHiringPostsIfEmpty();

  const prefs = (
    await db
      .select({
        targetRoles: userPreferences.targetRoles,
        targetLocations: userPreferences.targetLocations,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)
  )[0];

  const targetRoles = (Array.isArray(prefs?.targetRoles) ? prefs.targetRoles : []) as string[];
  const targetLocations = (Array.isArray(prefs?.targetLocations) ? prefs.targetLocations : []) as string[];

  // Fetch active curated hiring posts
  const allPosts = await db
    .select()
    .from(hiringPosts)
    .where(eq(hiringPosts.status, "active"))
    .orderBy(desc(hiringPosts.postedAt))
    .limit(50);

  const matched: DigestHiringPost[] = [];
  const remaining: DigestHiringPost[] = [];

  for (const p of allPosts) {
    const postObj: DigestHiringPost = {
      id: p.id,
      title: p.title,
      companyName: p.companyName,
      location: p.location,
      roleCategory: p.roleCategory,
      department: p.department,
      sourcePlatform: p.sourcePlatform,
      sourceUrl: p.sourceUrl,
      postSnippet: p.postSnippet,
      techStack: (Array.isArray(p.techStack) ? p.techStack : []) as string[],
      hiringManagerName: p.hiringManagerName,
      hiringManagerTitle: p.hiringManagerTitle,
      contactId: p.contactId,
      companyId: p.companyId,
      postedAt: p.postedAt,
    };

    // Check preference matching
    const titleLower = p.title.toLowerCase();
    const locLower = (p.location ?? "").toLowerCase();
    const stackStr = (Array.isArray(p.techStack) ? p.techStack.join(" ") : "").toLowerCase();

    const matchesRole =
      targetRoles.length === 0 ||
      targetRoles.some((r) => titleLower.includes(r.toLowerCase()) || stackStr.includes(r.toLowerCase()));
    const matchesLoc =
      targetLocations.length === 0 ||
      targetLocations.some((l) => locLower.includes(l.toLowerCase()) || locLower.includes("remote"));

    if (matchesRole && matchesLoc) {
      matched.push(postObj);
    } else {
      remaining.push(postObj);
    }
  }

  // Combine matched with remaining to reach target limit
  let selected = [...matched, ...remaining].slice(0, limit);

  // If still fewer than limit, backfill from directory hiring managers & contacts
  if (selected.length < limit) {
    const needed = limit - selected.length;
    const directoryContacts = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        title: contacts.title,
        roleCategory: contacts.roleCategory,
        location: contacts.location,
        companyId: contacts.companyId,
        verificationStatus: contacts.verificationStatus,
        companyName: companies.name,
        companyLocation: companies.location,
      })
      .from(contacts)
      .innerJoin(companies, eq(contacts.companyId, companies.id))
      .where(
        and(
          eq(contacts.status, "active"),
          inArray(contacts.roleCategory, ["founder", "engineering_manager", "tech_lead", "vp_engineering"]),
        ),
      )
      .limit(needed);

    for (const c of directoryContacts) {
      selected.push({
        id: c.id,
        title: `${c.title} (Hiring Team)`,
        companyName: c.companyName,
        location: c.location ?? c.companyLocation ?? "India / Remote",
        roleCategory: c.roleCategory,
        department: "engineering",
        sourcePlatform: "reachbee",
        sourceUrl: null,
        postSnippet: `${c.name} (${c.title}) at ${c.companyName}. Outreach contact in the ReachBee directory, mailbox checked at the last verification pass.`,
        techStack: ["Next.js", "Node.js", "PostgreSQL", "Full-Stack"],
        hiringManagerName: c.name,
        hiringManagerTitle: c.title,
        contactId: c.id,
        companyId: c.companyId,
        verificationStatus: c.verificationStatus,
        postedAt: new Date(),
      });
    }
  }

  return selected.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Email Digest HTML & Plaintext Rendering                             */
/* ------------------------------------------------------------------ */

export function renderDailyDigestHtml(params: {
  displayName: string;
  posts: DigestHiringPost[];
  contactCredits: number;
  aiCredits: number;
}): string {
  const name = params.displayName.trim() || "there";
  const baseUrl = getConfig().APP_BASE_URL.replace(/\/+$/, "");

  const postCardsHtml = params.posts
    .map((p, index) => {
      // Deep links must resolve to real routes. `/app?action=...` was a dead end:
      // the dashboard never reads search params, so every call to action in the
      // digest silently did nothing. Link straight at the contact instead.
      const draftUrl = `${baseUrl}/app/contacts${p.contactId ? `/${encodeURIComponent(p.contactId)}` : `?q=${encodeURIComponent(p.companyName)}`}`;
      // Reveal Email Deeplink (Consumes 1 Contact Reveal Credit)
      const revealUrl = `${baseUrl}/app/contacts${p.contactId ? `/${encodeURIComponent(p.contactId)}` : `?q=${encodeURIComponent(p.companyName)}`}`;

      const stackBadges = p.techStack
        .slice(0, 4)
        .map(
          (tech) =>
            `<span style="display:inline-block; background:#eeeade; color:#586257; font-size:11px; font-weight:600; padding:2px 8px; border-radius:4px; margin-right:4px; margin-bottom:4px;">${escapeHtml(tech)}</span>`,
        )
        .join("");

      const sourceBadge =
        p.sourcePlatform === "twitter"
          ? `<span style="background:#e7eef9; color:#245ead; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">X / founder post</span>`
          : p.sourcePlatform === "wellfound"
            ? `<span style="background:#faedc9; color:#704a08; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">Startup lead</span>`
            : // Only claim verification when the directory actually verified the
              // mailbox. Previously every backfilled contact got a "Verified
              // Decision-Maker" badge, including ones marked unknown or
              // catch-all — a false claim in an email sent to every user.
              p.verificationStatus === "verified"
              ? `<span style="background:#e5f0e7; color:#245a3b; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">Verified mailbox</span>`
              : p.verificationStatus === "catch_all"
                ? `<span style="background:#fff0cf; color:#704a08; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">Catch-all domain</span>`
                : `<span style="background:#eeeade; color:#586257; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">Directory contact</span>`;

      return `
      <div style="border:1px solid #dcdace; border-radius:10px; padding:16px; margin-bottom:14px; background:#fffdf7;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <div style="margin-bottom:4px;">${sourceBadge}</div>
            <div style="font-size:16px; font-weight:700; color:#18231e; margin:0 0 2px;">
              ${index + 1}. ${escapeHtml(p.title)}
            </div>
            <div style="font-size:13px; font-weight:600; color:#586257;">
              ${escapeHtml(p.companyName)} &bull; <span style="font-weight:400; color:#586257;">${escapeHtml(p.location ?? "Remote / Flexible")}</span>
            </div>
          </div>
        </div>

        <p style="font-size:13px; line-height:1.5; color:#586257; margin:8px 0 10px; background:#f7f4ec; padding:10px; border-radius:6px; border-left:3px solid #c8932a;">
          ${escapeHtml(p.postSnippet)}
        </p>

        ${
          p.hiringManagerName
            ? `<div style="font-size:12px; color:#586257; margin-bottom:10px;">
                <strong>Hiring Lead:</strong> ${escapeHtml(p.hiringManagerName)} ${p.hiringManagerTitle ? `(${escapeHtml(p.hiringManagerTitle)})` : ""}
              </div>`
            : ""
        }

        <div style="margin-bottom:12px;">${stackBadges}</div>

        <!-- High-Converting Action Triggers -->
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <a href="${draftUrl}" style="background-color:#18231e; color:#fffdf7 !important; text-decoration:none; font-size:12px; font-weight:600; padding:8px 14px; border-radius:6px; display:inline-block;">
            Draft in Gmail
          </a>
          <a href="${revealUrl}" style="background-color:#eeeade; color:#18231e !important; border:1px solid #cfd0c6; text-decoration:none; font-size:12px; font-weight:600; padding:7px 12px; border-radius:6px; display:inline-block;">
            Reveal email
          </a>
        </div>
      </div>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4ec; margin: 0; padding: 20px; color: #18231e; }
    .card { max-width: 600px; margin: 0 auto; background: #fffdf7; border-radius: 14px; border: 1px solid #dcdace; padding: 28px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
    .header { margin-bottom: 20px; border-bottom: 1px solid #e9e5d8; padding-bottom: 16px; }
    .logo { font-size: 20px; font-weight: 800; color: #18231e; text-decoration: none; }
    .logo span { color: #c8932a; }
    .balance-box { background: #faedc9; border: 1px solid #efd9a4; border-radius: 8px; padding: 12px 16px; margin: 16px 0 24px; font-size: 13px; color: #704a08; display: flex; justify-content: space-between; align-items: center; }
    .footer { margin-top: 32px; font-size: 12px; color: #71796f; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <a href="${baseUrl}" class="logo">ReachBee <span>AI</span></a>
      <div style="float: right; font-size: 12px; font-weight: 600; color: #8a5f13; background: #faedc9; padding: 4px 10px; border-radius: 12px;">
        Daily Morning Dispatch
      </div>
    </div>

    <h2 style="margin: 0 0 6px; font-size: 22px; color: #18231e;">Good morning, ${escapeHtml(name)}!</h2>
    <p style="font-size: 14px; color: #586257; margin: 0 0 16px; line-height: 1.5;">
      Here are today's <strong>10 curated hiring leads & active founders</strong> looking for developers. Click any post to prepare a tailored intro directly in your Gmail.
    </p>

    <!-- Credit Status & Consumption Trigger -->
    <div class="balance-box">
      <div>
        <strong>Your Workspace Balance:</strong><br/>
        <span>${params.contactCredits} Contact Reveals</span> &bull; <span>${params.aiCredits} AI Drafts Available</span>
      </div>
      <div>
        <a href="${baseUrl}/app/billing" style="color: #8a5f13; text-decoration: underline; font-weight: 700; font-size: 12px;">Get More</a>
      </div>
    </div>

    <!-- Posts Feed -->
    <div>
      ${postCardsHtml}
    </div>

    <!-- Footer Banner -->
    <div style="background:#eeeade; border-radius:8px; padding:16px; text-align:center; margin-top:24px;">
      <p style="font-size:13px; font-weight:600; color:#18231e; margin:0 0 6px;">Need more direct founder contacts or AI resume drafts?</p>
      <a href="${baseUrl}/app/billing" style="display:inline-block; background-color:#18231e; color:#fffdf7 !important; font-size:12px; font-weight:600; padding:8px 16px; border-radius:6px; text-decoration:none;">
        Explore Outreach Packs (from ₹150) &rarr;
      </a>
    </div>

    <div class="footer">
      <p>
        ReachBee AI by SayaLabs Studio • ${escapeHtml(baseUrl.replace(/^https?:\/\//, ""))}<br/>
        Autonomous Career Outreach & Decision-Maker Intelligence<br/>
        <a href="${baseUrl}/app/settings" style="color:#586257; text-decoration:underline;">Update morning digest preferences or unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

function renderDailyDigestText(params: {
  displayName: string;
  posts: DigestHiringPost[];
  contactCredits: number;
  aiCredits: number;
}): string {
  const lines: string[] = [];
  const baseUrl = getConfig().APP_BASE_URL.replace(/\/+$/, "");
  lines.push(`Good morning, ${params.displayName || "there"}!`);
  lines.push(`Here are today's 10 fresh hiring leads from ReachBee AI:\n`);

  params.posts.forEach((p, idx) => {
    lines.push(`${idx + 1}. ${p.title} at ${p.companyName} (${p.location ?? "Remote"})`);
    lines.push(`   Hiring Note: ${p.postSnippet}`);
    if (p.hiringManagerName) lines.push(`   Hiring Lead: ${p.hiringManagerName}`);
    lines.push(
      `   1-Click Gmail Draft: ${baseUrl}/app/contacts${p.contactId ? `/${encodeURIComponent(p.contactId)}` : `?q=${encodeURIComponent(p.companyName)}`}`,
    );
    lines.push("");
  });

  lines.push(`Your Balance: ${params.contactCredits} Contact Reveals, ${params.aiCredits} AI Drafts.`);
  lines.push(`Top up credits or adjust settings: ${baseUrl}/app/billing`);
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Dispatch Execution & Idempotency Safeguards                        */
/* ------------------------------------------------------------------ */

export type DispatchUserResult =
  | { success: true; emailId: string; postCount: number; date: string }
  | { success: false; skipped: true; reason: string; date: string }
  | { success: false; skipped?: false; error: string; date: string };

export async function dispatchDigestForUser(
  userId: string,
  options?: { force?: boolean },
): Promise<DispatchUserResult> {
  const force = options?.force ?? false;

  // 1. Fetch user + preferences
  const user = (
    await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
  )[0];

  if (!user || user.status !== "active") {
    return { success: false, skipped: true, reason: "USER_INACTIVE_OR_NOT_FOUND", date: new Date().toISOString().slice(0, 10) };
  }

  const prefs = (
    await db
      .select({
        dailyDigestEnabled: userPreferences.dailyDigestEnabled,
        timezone: userPreferences.timezone,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)
  )[0];

  if (prefs && !prefs.dailyDigestEnabled && !force) {
    return { success: false, skipped: true, reason: "DIGEST_PREFERENCE_DISABLED", date: new Date().toISOString().slice(0, 10) };
  }

  // Calculate local date string for idempotency
  const tz = prefs?.timezone || "Asia/Kolkata";
  let dispatchDate: string;
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    dispatchDate = formatter.format(new Date());
  } catch {
    dispatchDate = new Date().toISOString().slice(0, 10);
  }

  // 2. Claim today's dispatch BEFORE sending. Checking-then-sending let two
  // concurrent runs both pass the check and both email the user; the unique
  // (user_id, dispatch_date) constraint is the real serialization point.
  let claimId: string | null = null;
  if (!force) {
    const claimed = await db
      .insert(digestDispatches)
      .values({ userId, dispatchDate, postIds: [], status: "pending" })
      .onConflictDoNothing({ target: [digestDispatches.userId, digestDispatches.dispatchDate] })
      .returning({ id: digestDispatches.id });
    if (claimed.length === 0) {
      return { success: false, skipped: true, reason: "ALREADY_SENT_TODAY", date: dispatchDate };
    }
    claimId = claimed[0]!.id;
  }

  // 3. Get 10 curated posts
  const posts = await getDigestPostsForUser(userId, 10);
  if (posts.length === 0) {
    if (claimId) await db.delete(digestDispatches).where(eq(digestDispatches.id, claimId));
    return { success: false, skipped: true, reason: "NO_ACTIVE_POSTS", date: dispatchDate };
  }

  // 4. Get current user balances
  const balances = await getBalances(userId);

  // 5. Render email
  const html = renderDailyDigestHtml({
    displayName: user.displayName ?? "",
    posts,
    contactCredits: balances.contact.available,
    aiCredits: balances.ai.available,
  });

  const text = renderDailyDigestText({
    displayName: user.displayName ?? "",
    posts,
    contactCredits: balances.contact.available,
    aiCredits: balances.ai.available,
  });

  // 6. Send email via Resend. A thrown error must still release the claim,
  // otherwise one provider outage silently costs the user their digest.
  const subject = `${posts.length} hiring ${posts.length === 1 ? "lead" : "leads"}, ReachBee digest (${dispatchDate})`;
  let sendResult: SendEmailResult;
  try {
    sendResult = await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  } catch (err) {
    if (claimId) await db.delete(digestDispatches).where(eq(digestDispatches.id, claimId));
    const reason = err instanceof Error ? err.message : String(err);
    logger.error("digest.dispatch_threw", { userId, error: reason });
    return { success: false, error: reason, date: dispatchDate };
  }

  const postIds = posts.map((p) => p.id);

  if (!sendResult.success) {
    logger.warn("digest.dispatch_failed", { userId, email: user.email, reason: sendResult.reason });
    // Release the claim so the next run can retry instead of being permanently
    // blocked by a row that says "pending".
    if (claimId) await db.delete(digestDispatches).where(eq(digestDispatches.id, claimId));
    return { success: false, error: sendResult.reason, date: dispatchDate };
  }

  // 7. Finalise the dispatch record
  await db
    .insert(digestDispatches)
    .values({
      userId,
      dispatchDate,
      postIds,
      emailId: sendResult.id,
      status: "sent",
    })
    .onConflictDoUpdate({
      target: [digestDispatches.userId, digestDispatches.dispatchDate],
      set: {
        emailId: sendResult.id,
        postIds,
        dispatchedAt: new Date(),
        status: "sent",
      },
    });

  logger.info("digest.dispatched", { userId, email: user.email, postCount: posts.length, emailId: sendResult.id });
  return { success: true, emailId: sendResult.id, postCount: posts.length, date: dispatchDate };
}

/**
 * Dispatches the daily digest to active users who have dailyDigestEnabled.
 *
 * Batched: sending every user's email synchronously inside one request blows
 * past the Cloudflare Workers wall-clock limit as soon as the user base grows,
 * and a timeout mid-loop leaves the remainder silently unsent. Callers pass a
 * `afterUserId` cursor and re-invoke until `nextCursor` is null; the job
 * handler does exactly that.
 */
export async function dispatchAllDueDigests(options?: {
  force?: boolean;
  batchSize?: number;
  afterUserId?: string | null;
}): Promise<{
  totalEligible: number;
  dispatched: number;
  skipped: number;
  failed: number;
  nextCursor: string | null;
}> {
  const batchSize = Math.min(Math.max(options?.batchSize ?? 25, 1), 100);
  // Query all active users who have dailyDigestEnabled = true (or not opted out)
  const eligibleUsers = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .leftJoin(userPreferences, eq(users.id, userPreferences.userId))
    .where(
      and(
        eq(users.status, "active"),
        sql`coalesce(${userPreferences.dailyDigestEnabled}, true) = true`,
        ...(options?.afterUserId ? [gt(users.id, options.afterUserId)] : []),
      ),
    )
    .orderBy(users.id)
    .limit(batchSize);

  let dispatched = 0;
  let skipped = 0;
  let failed = 0;

  for (const u of eligibleUsers) {
    try {
      const res = await dispatchDigestForUser(u.id, options);
      if (res.success) {
        dispatched++;
      } else if ("skipped" in res && res.skipped) {
        skipped++;
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
      logger.error("digest.user_dispatch_error", {
        userId: u.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    totalEligible: eligibleUsers.length,
    dispatched,
    skipped,
    failed,
    // A short batch means there are probably more users; hand the cursor back
    // so the caller can continue rather than silently dropping the remainder.
    nextCursor: eligibleUsers.length === batchSize ? eligibleUsers[eligibleUsers.length - 1]!.id : null,
  };
}
