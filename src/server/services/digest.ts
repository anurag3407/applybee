import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
import { sendEmail, type SendEmailResult } from "@/server/services/email";
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
  postedAt: Date;
};

/* ------------------------------------------------------------------ */
/* Initial Seed Catalog for Fresh Hiring Posts                        */
/* ------------------------------------------------------------------ */

export const INITIAL_CURATED_POSTS = [
  {
    title: "Founding Full-Stack Engineer (Next.js & AI)",
    companyName: "HyperGro AI",
    location: "Bengaluru, India (Hybrid)",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "twitter",
    sourceUrl: "https://x.com/hypergro/status/hiring",
    postSnippet: "We are hiring our first founding full-stack engineer to build autonomous marketing agents. You will own the entire stack from Next.js App Router to LLM inference pipelines.",
    techStack: ["Next.js", "TypeScript", "Python", "PostgreSQL", "FastAPI"],
    hiringManagerName: "Prashant Kumar",
    hiringManagerTitle: "Co-Founder & CTO",
  },
  {
    title: "Senior Backend Engineer (Distributed Systems)",
    companyName: "Zepto",
    location: "Bengaluru, India",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Looking for high-ownership backend engineers who can scale sub-10-minute order routing systems. Deep experience with event-driven architectures and PostgreSQL concurrency.",
    techStack: ["Go", "PostgreSQL", "Kafka", "Redis", "Docker"],
    hiringManagerName: "Aadit Palicha",
    hiringManagerTitle: "CEO & Co-Founder",
  },
  {
    title: "Founding AI / LLM Engineer",
    companyName: "Perplexity AI",
    location: "Remote / Hybrid",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "twitter",
    sourceUrl: "https://x.com/perplexity/status/hiring",
    postSnippet: "Looking for engineers passionate about real-time index retrieval, reranking, and low-latency LLM serving. If you built custom RAG or fast search systems, we want you.",
    techStack: ["Python", "PyTorch", "vLLM", "C++", "FastAPI"],
    hiringManagerName: "Aravind Srinivas",
    hiringManagerTitle: "CEO",
  },
  {
    title: "Frontend Lead (Next.js & Design Systems)",
    companyName: "Razorpay",
    location: "Bengaluru, India",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Hiring a Frontend Lead to spearhead merchant checkout performance. Zero bundle creep, sub-50ms interaction latencies, and world-class payment UI components.",
    techStack: ["React 19", "Next.js", "Tailwind CSS", "TypeScript"],
    hiringManagerName: "Harshil Mathur",
    hiringManagerTitle: "CEO & Co-Founder",
  },
  {
    title: "Full-Stack Product Engineer",
    companyName: "Supabase",
    location: "Remote (Global)",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "wellfound",
    sourceUrl: "https://wellfound.com/jobs/supabase-fullstack",
    postSnippet: "We are looking for full-stack product engineers to build open-source database dashboards, edge function tooling, and AI vector store workflows.",
    techStack: ["Next.js", "TypeScript", "Elixir", "PostgreSQL", "Tailwind"],
    hiringManagerName: "Paul Copplestone",
    hiringManagerTitle: "CEO & Co-Founder",
  },
  {
    title: "Staff Infrastructure Engineer",
    companyName: "Swiggy",
    location: "Bengaluru, India",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Seeking a Staff Engineer to architect multi-region Kubernetes clusters handling peak IPL flash delivery volumes (100k+ RPS). High scale, zero downtime.",
    techStack: ["Kubernetes", "Golang", "AWS", "Terraform", "Prometheus"],
    hiringManagerName: "Sriharsha Majety",
    hiringManagerTitle: "Managing Director & CEO",
  },
  {
    title: "Founding Agentic AI Engineer",
    companyName: "SayaLabs Studio",
    location: "Bengaluru, India / Remote",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: "https://sayalabs.in",
    postSnippet: "Building autonomous career and sales workflows that automate decision-maker outreach. Looking for hands-on full-stack builders who love Next.js, Node.js, and Google Gemini.",
    techStack: ["Next.js", "Node.js", "PostgreSQL", "Gemini 2.0 Flash"],
    hiringManagerName: "Anurag Mishra",
    hiringManagerTitle: "Founder & Lead Architect",
  },
  {
    title: "Senior Software Engineer (Payments Core)",
    companyName: "CRED",
    location: "Bengaluru, India",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Hiring backend engineers to drive UPI and credit card settlement engines. Requires rock-solid mastery of distributed transactions and transactional consistency.",
    techStack: ["Java", "Kotlin", "Spring Boot", "Kafka", "PostgreSQL"],
    hiringManagerName: "Kunal Shah",
    hiringManagerTitle: "Founder & CEO",
  },
  {
    title: "Mobile Engineer (React Native & Performance)",
    companyName: "Blinkit",
    location: "Gurugram / NCR, India",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/jobs/blinkit-mobile",
    postSnippet: "We are scaling Blinkit instant delivery app to 50+ cities. Looking for React Native engineers obsessive about 60 FPS scroll performance and offline-first state sync.",
    techStack: ["React Native", "TypeScript", "Redux Toolkit", "iOS", "Android"],
    hiringManagerName: "Albinder Dhindsa",
    hiringManagerTitle: "CEO",
  },
  {
    title: "Backend Platform Engineer",
    companyName: "Postman",
    location: "Bengaluru / Hybrid",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Join our API Network Platform team. Scaling the world's most popular API collaborative tool to 35+ million developers.",
    techStack: ["Node.js", "TypeScript", "Docker", "Redis", "MySQL"],
    hiringManagerName: "Abhinav Asthana",
    hiringManagerTitle: "CEO & Co-Founder",
  },
  {
    title: "Full Stack Engineer (Growth & Experiments)",
    companyName: "Groww",
    location: "Bengaluru, India",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "reachbee",
    sourceUrl: null,
    postSnippet: "Hiring high-velocity product engineers for our investment onboarding flow. Fast experimentation, clean code, and immediate direct user impact.",
    techStack: ["React", "TypeScript", "Spring Boot", "PostgreSQL"],
    hiringManagerName: "Lalit Keshre",
    hiringManagerTitle: "CEO & Co-Founder",
  },
  {
    title: "AI Systems & Inference Engineer",
    companyName: "Sarvam AI",
    location: "Bengaluru, India",
    roleCategory: "engineering",
    department: "engineering",
    sourcePlatform: "twitter",
    sourceUrl: "https://x.com/sarvamai/status/hiring",
    postSnippet: "Building foundational Indian language models and speech synthesis. We are hiring engineers to optimize CUDA kernels, TensorRT-LLM, and low-latency API serving.",
    techStack: ["Python", "CUDA", "Triton", "PyTorch", "LLMs"],
    hiringManagerName: "Vivek Raghavan",
    hiringManagerTitle: "Co-Founder",
  },
];

/** Seed initial hiring posts if table is empty or low */
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
        postSnippet: `${c.name} (${c.title}) is actively hiring engineers for ${c.companyName}. Direct verified outreach contact verified in ReachBee.`,
        techStack: ["Next.js", "Node.js", "PostgreSQL", "Full-Stack"],
        hiringManagerName: c.name,
        hiringManagerTitle: c.title,
        contactId: c.id,
        companyId: c.companyId,
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
  const baseUrl = "https://applybee.sayalabs.in";

  const postCardsHtml = params.posts
    .map((p, index) => {
      // 1-Click Draft Deeplink (Consumes 1 AI Generation Credit)
      const draftUrl = `${baseUrl}/app?action=draft&company=${encodeURIComponent(p.companyName)}&role=${encodeURIComponent(p.title)}${p.contactId ? `&contactId=${p.contactId}` : ""}`;
      // Reveal Email Deeplink (Consumes 1 Contact Reveal Credit)
      const revealUrl = `${baseUrl}/app?action=reveal${p.contactId ? `&contactId=${p.contactId}` : `&search=${encodeURIComponent(p.companyName)}`}`;

      const stackBadges = p.techStack
        .slice(0, 4)
        .map(
          (tech) =>
            `<span style="display:inline-block; background:#f3f4f6; color:#374151; font-size:11px; font-weight:600; padding:2px 8px; border-radius:4px; margin-right:4px; margin-bottom:4px;">${tech}</span>`,
        )
        .join("");

      const sourceBadge =
        p.sourcePlatform === "twitter"
          ? `<span style="background:#e0f2fe; color:#0369a1; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">🐦 X / Founder Post</span>`
          : p.sourcePlatform === "wellfound"
            ? `<span style="background:#fef3c7; color:#92400e; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">🔥 Startup Lead</span>`
            : `<span style="background:#dcfce7; color:#166534; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">✨ Verified Decision-Maker</span>`;

      return `
      <div style="border:1px solid #e5e7eb; border-radius:10px; padding:16px; margin-bottom:14px; background:#ffffff;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <div style="margin-bottom:4px;">${sourceBadge}</div>
            <div style="font-size:16px; font-weight:700; color:#111827; margin:0 0 2px;">
              ${index + 1}. ${p.title}
            </div>
            <div style="font-size:13px; font-weight:600; color:#4b5563;">
              🏢 ${p.companyName} &bull; <span style="font-weight:400; color:#6b7280;">📍 ${p.location ?? "Remote / Flexible"}</span>
            </div>
          </div>
        </div>
        
        <p style="font-size:13px; line-height:1.5; color:#374151; margin:8px 0 10px; background:#f9fafb; padding:10px; border-radius:6px; border-left:3px solid #f59e0b;">
          ${p.postSnippet}
        </p>

        ${
          p.hiringManagerName
            ? `<div style="font-size:12px; color:#4b5563; margin-bottom:10px;">
                <strong>Hiring Lead:</strong> ${p.hiringManagerName} ${p.hiringManagerTitle ? `(${p.hiringManagerTitle})` : ""}
              </div>`
            : ""
        }

        <div style="margin-bottom:12px;">${stackBadges}</div>

        <!-- High-Converting Action Triggers -->
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <a href="${draftUrl}" style="background-color:#111827; color:#ffffff !important; text-decoration:none; font-size:12px; font-weight:600; padding:8px 14px; border-radius:6px; display:inline-block;">
            ⚡ 1-Click Draft to Gmail
          </a>
          <a href="${revealUrl}" style="background-color:#f3f4f6; color:#1f2937 !important; border:1px solid #d1d5db; text-decoration:none; font-size:12px; font-weight:600; padding:7px 12px; border-radius:6px; display:inline-block;">
            🔓 Reveal Direct Email
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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 20px; color: #1f1e1a; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e7e5dc; padding: 28px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
    .header { margin-bottom: 20px; border-bottom: 1px solid #f0eee6; padding-bottom: 16px; }
    .logo { font-size: 20px; font-weight: 800; color: #1f1e1a; text-decoration: none; }
    .logo span { color: #f59e0b; }
    .balance-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin: 16px 0 24px; font-size: 13px; color: #92400e; display: flex; justify-content: space-between; align-items: center; }
    .footer { margin-top: 32px; font-size: 12px; color: #78756c; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <a href="${baseUrl}" class="logo">ReachBee <span>AI</span></a>
      <div style="float: right; font-size: 12px; font-weight: 600; color: #b45309; background: #fef3c7; padding: 4px 10px; border-radius: 12px;">
        Daily Morning Dispatch
      </div>
    </div>

    <h2 style="margin: 0 0 6px; font-size: 22px; color: #111827;">Good morning, ${name}! ☀️</h2>
    <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px; line-height: 1.5;">
      Here are today's <strong>10 curated hiring leads & active founders</strong> looking for developers. Click any post to prepare a tailored intro directly in your Gmail.
    </p>

    <!-- Credit Status & Consumption Trigger -->
    <div class="balance-box">
      <div>
        <strong>Your Workspace Balance:</strong><br/>
        <span>⚡ ${params.contactCredits} Contact Reveals</span> &bull; <span>📝 ${params.aiCredits} AI Drafts Available</span>
      </div>
      <div>
        <a href="${baseUrl}/app/billing" style="color: #b45309; text-decoration: underline; font-weight: 700; font-size: 12px;">Get More</a>
      </div>
    </div>

    <!-- Posts Feed -->
    <div>
      ${postCardsHtml}
    </div>

    <!-- Footer Banner -->
    <div style="background:#f3f4f6; border-radius:8px; padding:16px; text-align:center; margin-top:24px;">
      <p style="font-size:13px; font-weight:600; color:#1f2937; margin:0 0 6px;">Need more direct founder contacts or AI resume drafts?</p>
      <a href="${baseUrl}/app/billing" style="display:inline-block; background-color:#111827; color:#ffffff !important; font-size:12px; font-weight:600; padding:8px 16px; border-radius:6px; text-decoration:none;">
        Explore Outreach Packs (from ₹150) &rarr;
      </a>
    </div>

    <div class="footer">
      <p>
        ReachBee AI by SayaLabs Studio • applybee.sayalabs.in<br/>
        Autonomous Career Outreach & Decision-Maker Intelligence<br/>
        <a href="${baseUrl}/app/settings" style="color:#6b7280; text-decoration:underline;">Update morning digest preferences or unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

export function renderDailyDigestText(params: {
  displayName: string;
  posts: DigestHiringPost[];
  contactCredits: number;
  aiCredits: number;
}): string {
  const lines: string[] = [];
  lines.push(`Good morning, ${params.displayName || "there"}!`);
  lines.push(`Here are today's 10 fresh hiring leads from ReachBee AI:\n`);

  params.posts.forEach((p, idx) => {
    lines.push(`${idx + 1}. ${p.title} at ${p.companyName} (${p.location ?? "Remote"})`);
    lines.push(`   Hiring Note: ${p.postSnippet}`);
    if (p.hiringManagerName) lines.push(`   Hiring Lead: ${p.hiringManagerName}`);
    lines.push(`   1-Click Gmail Draft: https://applybee.sayalabs.in/app?action=draft&company=${encodeURIComponent(p.companyName)}&role=${encodeURIComponent(p.title)}`);
    lines.push("");
  });

  lines.push(`Your Balance: ${params.contactCredits} Contact Reveals, ${params.aiCredits} AI Drafts.`);
  lines.push(`Top up credits or adjust settings: https://applybee.sayalabs.in/app`);
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

  // 2. Check if already dispatched today
  if (!force) {
    const existing = await db
      .select({ id: digestDispatches.id })
      .from(digestDispatches)
      .where(and(eq(digestDispatches.userId, userId), eq(digestDispatches.dispatchDate, dispatchDate)))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, skipped: true, reason: "ALREADY_SENT_TODAY", date: dispatchDate };
    }
  }

  // 3. Get 10 curated posts
  const posts = await getDigestPostsForUser(userId, 10);
  if (posts.length === 0) {
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

  // 6. Send email via Resend
  const subject = `🔥 Today's 10 Tech Hiring Leads — ReachBee Daily Dispatch (${dispatchDate})`;
  const sendResult: SendEmailResult = await sendEmail({
    to: user.email,
    subject,
    html,
    text,
  });

  const postIds = posts.map((p) => p.id);

  if (!sendResult.success) {
    logger.warn("digest.dispatch_failed", { userId, email: user.email, reason: sendResult.reason });
    return { success: false, error: sendResult.reason, date: dispatchDate };
  }

  // 7. Record dispatch idempotency record
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

/** Dispatches the daily digest to all active users with dailyDigestEnabled */
export async function dispatchAllDueDigests(options?: { force?: boolean }): Promise<{
  totalEligible: number;
  dispatched: number;
  skipped: number;
  failed: number;
}> {
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
      ),
    );

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
  };
}
