/**
 * Deterministic fictional seed data (plan §7, §27.2): invented people and
 * reserved example domains only. Production directory seeds require licensed
 * source evidence (§23.3) — this script must never run against production.
 */
import "./env";
import { createCipheriv, createHash, createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const client = new Client({ connectionString: process.env.DATABASE_URL });

// Envelope encryption for protected-at-rest emails (dev key).
const KEY = process.env.TOKEN_ENCRYPTION_KEY
  ? Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, "base64")
  : createHash("sha256").update("applybee-local-dev-encryption-key").digest();

function encryptEmail(plain: string, aad: string): string {
  const iv = Buffer.from(randomUUID().replace(/-/g, "").slice(0, 24), "hex");
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  cipher.setAAD(Buffer.from(aad));
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64")}.${enc.toString("base64")}.${cipher.getAuthTag().toString("base64")}`;
}

function fingerprint(email: string): string {
  return createHmac("sha256", KEY).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

const CATALOG: Array<{
  sku: string; name: string; description: string; price: number; contact: number; ai: number; order: number;
}> = [
  { sku: "free_trial_v1", name: "Free trial", description: "Once per verified account. No card required.", price: 0, contact: 5, ai: 2, order: 0 },
  { sku: "explorer_v1", name: "ReachBee AI Career Workspace — Explorer", description: "Job application drafting workspace, verified manager directory, and personal pipeline.", price: 14900, contact: 75, ai: 0, order: 1 },
  { sku: "plus_v1", name: "ReachBee AI Career Workspace — Plus", description: "Career workspace with 150 manager reveals and 30 bespoke AI application drafts.", price: 29900, contact: 150, ai: 30, order: 2 },
  { sku: "pro_v1", name: "ReachBee AI Career Workspace — Pro", description: "Professional job search suite with 350 manager reveals, 75 AI resume drafts, and company tech-stack matching.", price: 59900, contact: 350, ai: 75, order: 3 },
  { sku: "contacts_100_v1", name: "100 Outreach Credits", description: "Direct manager outreach reveal credits with instant bounce replacement guarantee.", price: 19900, contact: 100, ai: 0, order: 4 },
  { sku: "ai_25_v1", name: "25 AI Resume Co-Pilot Credits", description: "Bespoke technical application drafts tailored to target company tech stacks.", price: 24900, contact: 0, ai: 25, order: 5 },
];

const COMPANIES = [
  { name: "Lumen Analytics", domain: "lumen-analytics.example", location: "Bengaluru", stage: "growth", category: "Data platforms", description: "Product analytics for fintech teams." },
  { name: "Kite Robotics", domain: "kite-robotics.example", location: "Pune", stage: "startup", category: "Hardware & robotics", description: "Warehouse automation robots." },
  { name: "Sahaj Health", domain: "sahaj-health.example", location: "Hyderabad", stage: "startup", category: "Health tech", description: "Primary-care diagnostics network." },
  { name: "Meridian Cloud", domain: "meridian-cloud.example", location: "Remote (India)", stage: "unicorn", category: "Cloud infrastructure", description: "Managed Kubernetes and edge compute." },
  { name: "Arambh Fintech", domain: "arambh-fintech.example", location: "Mumbai", stage: "growth", category: "Fintech", description: "Savings and investment APIs." },
  { name: "Vahak Mobility", domain: "vahak-mobility.example", location: "NCR", stage: "startup", category: "Mobility", description: "EV fleet operations software." },
];

const NAMES: Array<{
  name: string;
  title: string;
  role: string;
  department: "engineering" | "design" | "content" | "sales" | "product_ops";
  hiring: boolean;
  verification: string;
  domain: string;
  location: string;
}> = [
  // 💻 Software & Engineering
  { name: "Priya Sharma", title: "Engineering Manager, Platform", role: "engineering_manager", department: "engineering", hiring: true, verification: "verified", domain: "lumen-analytics.example", location: "Bengaluru" },
  { name: "Aravind Menon", title: "Staff Frontend Architect", role: "tech_lead", department: "engineering", hiring: false, verification: "verified", domain: "lumen-analytics.example", location: "Bengaluru" },
  { name: "Rohit Deshpande", title: "VP Engineering", role: "vp_engineering", department: "engineering", hiring: true, verification: "catch_all", domain: "kite-robotics.example", location: "Pune" },
  { name: "Farhan Qureshi", title: "Tech Lead, Mobile & Backend", role: "tech_lead", department: "engineering", hiring: false, verification: "verified", domain: "vahak-mobility.example", location: "NCR" },

  // 🎨 Product & Design
  { name: "Kavya Sundaram", title: "Head of Product Design & UX", role: "tech_lead", department: "design", hiring: true, verification: "verified", domain: "lumen-analytics.example", location: "Bengaluru" },
  { name: "Arjun Nambiar", title: "Design Director (UI/UX Systems)", role: "vp_engineering", department: "design", hiring: true, verification: "verified", domain: "arambh-fintech.example", location: "Mumbai" },

  // ✍️ Content & Writing
  { name: "Rhea Sen", title: "Head of Content & Editorial", role: "tech_lead", department: "content", hiring: true, verification: "verified", domain: "sahaj-health.example", location: "Hyderabad" },
  { name: "Tanmay Bhattacharya", title: "Lead Technical Writer & Content Strategist", role: "tech_lead", department: "content", hiring: false, verification: "verified", domain: "meridian-cloud.example", location: "Remote (India)" },

  // 💼 Sales & BizDev
  { name: "Sameer Verma", title: "VP of Sales & Commercial Partnerships", role: "vp_engineering", department: "sales", hiring: true, verification: "verified", domain: "arambh-fintech.example", location: "Mumbai" },
  { name: "Neha Joshi", title: "Head of Enterprise Business Development", role: "tech_lead", department: "sales", hiring: true, verification: "verified", domain: "kite-robotics.example", location: "Pune" },

  // 🚀 Product & Operations
  { name: "Dr. Vikram Rao", title: "Co-founder & CEO", role: "founder", department: "product_ops", hiring: true, verification: "verified", domain: "sahaj-health.example", location: "Hyderabad" },
  { name: "Divya Reddy", title: "Co-founder & Chief of Staff", role: "founder", department: "product_ops", hiring: true, verification: "catch_all", domain: "vahak-mobility.example", location: "NCR" },
  { name: "Meera Nair", title: "Head of Talent & Operations", role: "recruiter", department: "product_ops", hiring: true, verification: "verified", domain: "meridian-cloud.example", location: "Remote (India)" },
];

const EVIDENCE: Record<string, Array<{ type: string; value: string; source: string }>> = {
  "lumen-analytics.example": [
    { type: "focus", value: "Building realtime product-analytics pipelines for fintech customers.", source: "Company engineering blog, 2026-08" },
    { type: "stack", value: "Public job posts mention Kafka, Flink, and Go services.", source: "Careers page snapshot, 2026-09" },
  ],
  "kite-robotics.example": [
    { type: "focus", value: "Fleet orchestration software for warehouse robots; hardware-software integration.", source: "Company site, 2026-07" },
  ],
  "sahaj-health.example": [
    { type: "focus", value: "Diagnostic network expansion into tier-2 cities; data quality tooling is a stated priority.", source: "Founder interview, 2026-09" },
  ],
  "meridian-cloud.example": [
    { type: "stack", value: "Open-source contributions to Kubernetes operators and eBPF tooling.", source: "Public GitHub org, checked 2026-09" },
    { type: "scale", value: "Team publicly stated as 400+ across India and Singapore.", source: "Company about page, 2026-08" },
  ],
  "arambh-fintech.example": [
    { type: "focus", value: "Investment API platform; reliability engineering emphasis after 2026 outages.", source: "Engineering postmortem summaries, 2026-06" },
  ],
  "vahak-mobility.example": [
    { type: "focus", value: "EV fleet telemetry platform; mobile apps are a growing surface.", source: "Product page, 2026-08" },
  ],
};

async function main() {
  await client.connect();
  const count = await client.query<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM catalog_skus",
  );
  if (count.rows[0]?.c !== "0") {
    console.log("Seed already applied — skipping (idempotent).");
    await client.end();
    return;
  }

  // Catalog
  const cat = await client.query<{ id: string }>(
    `INSERT INTO catalog_versions (version, state, published_at) VALUES ('2026-10-04.1', 'published', now()) RETURNING id`,
  );
  const catalogId = cat.rows[0]!.id;
  for (const sku of CATALOG) {
    await client.query(
      `INSERT INTO catalog_skus (catalog_version_id, sku, name, description, price_paise, contact_credits, ai_credits, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [catalogId, sku.sku, sku.name, sku.description, sku.price, sku.contact, sku.ai, sku.order],
    );
  }

  // Companies + evidence
  const companyIds = new Map<string, string>();
  for (const c of COMPANIES) {
    const res = await client.query<{ id: string }>(
      `INSERT INTO companies (name, domain, location, stage, category, description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [c.name, c.domain, c.location, c.stage, c.category, c.description],
    );
    companyIds.set(c.domain, res.rows[0]!.id);
    for (const ev of EVIDENCE[c.domain] ?? []) {
      await client.query(
        `INSERT INTO company_evidence (company_id, fact_type, value, source_name, checked_at, confidence)
         VALUES ($1,$2,$3,$4, now() - interval '20 days', 'medium')`,
        [res.rows[0]!.id, ev.type, ev.value, ev.source],
      );
    }
  }

  // Contacts
  for (const p of NAMES) {
    const companyId = companyIds.get(p.domain)!;
    const email = `${p.name.toLowerCase().replace(/[^a-z]+/g, ".")}@${p.domain}`;
    const local = p.name.toLowerCase().replace(/[^a-z]+/g, ".");
    const res = await client.query<{ id: string }>(
      `INSERT INTO contacts (company_id, name, title, role_category, department, location, email_fingerprint, email_domain,
        status, verification_status, last_email_checked_at, employment_checked_at, is_hiring_manager)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now() - interval '12 days', now() - interval '40 days', $11)
       RETURNING id`,
      [
        companyId, p.name, p.title, p.role, p.department, p.location,
        fingerprint(email), p.domain,
        p.verification === "stale" ? "stale" : "active",
        p.verification === "stale" ? "unknown" : p.verification,
        p.hiring,
      ],
    );
    const contactId = res.rows[0]!.id;
    // Envelope AAD binds the contact id (derivable without the plaintext).
    await client.query(`UPDATE contacts SET email_enc = $1 WHERE id = $2`, [
      encryptEmail(email, `contact:${contactId}`),
      contactId,
    ]);
  }

  // Default personal templates for demonstration are created per-user at signup.

  console.log("Seed complete: catalog, companies, evidence, contacts.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
