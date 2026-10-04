import "server-only";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { db } from "@/db/client";
import { storageObjects } from "@/db/schema";
import { getConfig } from "@/server/config";

/**
 * Multi-provider Object Store adapter (§6.2).
 * Priority chain:
 *   Cloudflare R2 > Appwrite > Supabase > Neon (PostgreSQL bytea) > Local filesystem
 */

export type ObjectMetadata = {
  byteSize: number;
  sha256: string;
  contentType: string | null;
};

export interface ObjectStore {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<ObjectMetadata>;
  get(key: string): Promise<Uint8Array>;
  metadata(key: string): Promise<ObjectMetadata | null>;
  delete(key: string): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* 1. Local filesystem store (Offline development fallback)            */
/* ------------------------------------------------------------------ */

class LocalObjectStore implements ObjectStore {
  constructor(private bucket: string) {}

  private rootFor(): string {
    return path.resolve(process.cwd(), ".data/private", this.bucket);
  }

  private resolve(key: string): string {
    const normalized = path.normalize(key);
    if (normalized.startsWith("..") || path.isAbsolute(normalized) || normalized.includes("../")) {
      throw new Error("INVALID_OBJECT_KEY");
    }
    return path.join(this.rootFor(), normalized);
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<ObjectMetadata> {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    return this.metadata(key).then((m) => ({ ...m!, contentType }));
  }

  async get(key: string): Promise<Uint8Array> {
    const buf = await readFile(this.resolve(key));
    return new Uint8Array(buf);
  }

  async metadata(key: string): Promise<ObjectMetadata | null> {
    try {
      const target = this.resolve(key);
      const s = await stat(target);
      const buf = await readFile(target);
      return {
        byteSize: s.size,
        sha256: createHash("sha256").update(buf).digest("hex"),
        contentType: null,
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolve(key));
    } catch {
      // already absent
    }
  }
}

/* ------------------------------------------------------------------ */
/* 2. Neon / PostgreSQL bytea Store (Zero-config, 100% Free)           */
/* ------------------------------------------------------------------ */

class NeonObjectStore implements ObjectStore {
  private static tableEnsured = false;

  constructor(private bucket: string) {}

  private async ensureTable(): Promise<void> {
    if (NeonObjectStore.tableEnsured) return;
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS storage_objects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          bucket TEXT NOT NULL,
          object_key TEXT NOT NULL,
          bytes BYTEA NOT NULL,
          byte_size INTEGER NOT NULL,
          content_type TEXT,
          sha256 TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT storage_objects_bucket_key_idx UNIQUE (bucket, object_key)
        );
      `);
      NeonObjectStore.tableEnsured = true;
    } catch (err) {
      // The table normally comes from 0002_storage_objects.sql and the runtime
      // role should never need to create it. Log rather than fail silently so a
      // least-privilege misconfiguration is diagnosable.
      NeonObjectStore.tableEnsured = true;
      console.error("[objectStore] storage_objects ensure-table failed:", String(err));
    }
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<ObjectMetadata> {
    await this.ensureTable();
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const buf = Buffer.from(bytes);

    await db
      .insert(storageObjects)
      .values({
        bucket: this.bucket,
        objectKey: key,
        bytes: buf,
        byteSize: bytes.length,
        contentType,
        sha256,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [storageObjects.bucket, storageObjects.objectKey],
        set: {
          bytes: buf,
          byteSize: bytes.length,
          contentType,
          sha256,
          updatedAt: new Date(),
        },
      });

    return {
      byteSize: bytes.length,
      sha256,
      contentType,
    };
  }

  async get(key: string): Promise<Uint8Array> {
    await this.ensureTable();
    const rows = await db
      .select({ bytes: storageObjects.bytes })
      .from(storageObjects)
      .where(and(eq(storageObjects.bucket, this.bucket), eq(storageObjects.objectKey, key)))
      .limit(1);

    const row = rows[0];
    if (!row || !row.bytes) {
      throw new Error(`Object not found in Neon database storage: ${this.bucket}/${key}`);
    }
    return new Uint8Array(row.bytes);
  }

  async metadata(key: string): Promise<ObjectMetadata | null> {
    await this.ensureTable();
    const rows = await db
      .select({
        byteSize: storageObjects.byteSize,
        sha256: storageObjects.sha256,
        contentType: storageObjects.contentType,
      })
      .from(storageObjects)
      .where(and(eq(storageObjects.bucket, this.bucket), eq(storageObjects.objectKey, key)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return row;
  }

  async delete(key: string): Promise<void> {
    await this.ensureTable();
    await db
      .delete(storageObjects)
      .where(and(eq(storageObjects.bucket, this.bucket), eq(storageObjects.objectKey, key)));
  }
}

/* ------------------------------------------------------------------ */
/* 3. Supabase Storage (100% Free, 1 GB)                               */
/* ------------------------------------------------------------------ */

class SupabaseObjectStore implements ObjectStore {
  private client: SupabaseClient | null = null;

  constructor(
    private bucketName: string,
    private prefix: string,
  ) {}

  private getClient(): SupabaseClient {
    if (this.client) return this.client;
    const config = getConfig();
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase storage");
    }
    this.client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    return this.client;
  }

  private resolveKey(key: string): string {
    const cleanKey = key.replace(/^\/+/, "");
    return `${this.prefix}/${cleanKey}`;
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<ObjectMetadata> {
    const fullKey = this.resolveKey(key);
    const client = this.getClient();
    const { error } = await client.storage
      .from(this.bucketName)
      .upload(fullKey, bytes, { contentType, upsert: true });

    if (error) {
      throw new Error(`Supabase storage upload failed: ${error.message}`);
    }

    const sha256 = createHash("sha256").update(bytes).digest("hex");
    return {
      byteSize: bytes.length,
      sha256,
      contentType,
    };
  }

  async get(key: string): Promise<Uint8Array> {
    const fullKey = this.resolveKey(key);
    const client = this.getClient();
    const { data, error } = await client.storage.from(this.bucketName).download(fullKey);
    if (error || !data) {
      throw new Error(`Supabase storage download failed: ${error?.message || "Not found"}`);
    }
    const buffer = await data.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async metadata(key: string): Promise<ObjectMetadata | null> {
    const fullKey = this.resolveKey(key);
    const client = this.getClient();
    const dir = path.dirname(fullKey);
    const fileName = path.basename(fullKey);
    const { data, error } = await client.storage
      .from(this.bucketName)
      .list(dir === "." ? undefined : dir, { search: fileName, limit: 1 });

    if (error || !data || data.length === 0) return null;
    const match = data.find((item) => item.name === fileName);
    if (!match) return null;

    return {
      byteSize: match.metadata?.size ?? 0,
      sha256: match.metadata?.eTag ?? "",
      contentType: match.metadata?.mimetype ?? null,
    };
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.resolveKey(key);
    const client = this.getClient();
    await client.storage.from(this.bucketName).remove([fullKey]);
  }
}

/* ------------------------------------------------------------------ */
/* 4. Appwrite Storage (Free 2 GB, REST API via fetch)                 */
/* ------------------------------------------------------------------ */

class AppwriteStore implements ObjectStore {
  constructor(
    private bucketId: string,
    private prefix: string,
  ) {}

  private getEndpointAndHeaders(): { endpoint: string; headers: Record<string, string> } {
    const config = getConfig();
    if (!config.APPWRITE_PROJECT_ID || !config.APPWRITE_API_KEY) {
      throw new Error("APPWRITE_PROJECT_ID and APPWRITE_API_KEY are required for Appwrite storage");
    }
    const endpoint = (config.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1").replace(/\/+$/, "");
    return {
      endpoint,
      headers: {
        "X-Appwrite-Project": config.APPWRITE_PROJECT_ID,
        "X-Appwrite-Key": config.APPWRITE_API_KEY,
      },
    };
  }

  private fileIdForKey(key: string): string {
    const cleanKey = key.replace(/^\/+/, "");
    // Appwrite file IDs must be alphanumeric or hyphen/dot/underscore <= 36 chars
    return createHash("md5").update(`${this.prefix}:${cleanKey}`).digest("hex");
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<ObjectMetadata> {
    const fileId = this.fileIdForKey(key);
    const { endpoint, headers } = this.getEndpointAndHeaders();

    // Check if file already exists; delete before uploading to mimic upsert
    try {
      await fetch(`${endpoint}/storage/buckets/${this.bucketId}/files/${fileId}`, {
        method: "DELETE",
        headers,
      });
    } catch {
      // Ignore if absent
    }

    const formData = new FormData();
    formData.append("fileId", fileId);
    formData.append("file", new Blob([Buffer.from(bytes)], { type: contentType }), path.basename(key) || "upload.pdf");

    const res = await fetch(`${endpoint}/storage/buckets/${this.bucketId}/files`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Appwrite storage upload failed (${res.status}): ${errText}`);
    }

    const sha256 = createHash("sha256").update(bytes).digest("hex");
    return {
      byteSize: bytes.length,
      sha256,
      contentType,
    };
  }

  async get(key: string): Promise<Uint8Array> {
    const fileId = this.fileIdForKey(key);
    const { endpoint, headers } = this.getEndpointAndHeaders();

    const res = await fetch(`${endpoint}/storage/buckets/${this.bucketId}/files/${fileId}/download`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      throw new Error(`Appwrite storage download failed (${res.status})`);
    }

    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  }

  async metadata(key: string): Promise<ObjectMetadata | null> {
    const fileId = this.fileIdForKey(key);
    const { endpoint, headers } = this.getEndpointAndHeaders();

    const res = await fetch(`${endpoint}/storage/buckets/${this.bucketId}/files/${fileId}`, {
      method: "GET",
      headers,
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { sizeOriginal?: number; mimeType?: string; $id?: string };
    return {
      byteSize: json.sizeOriginal ?? 0,
      sha256: json.$id ?? "",
      contentType: json.mimeType ?? null,
    };
  }

  async delete(key: string): Promise<void> {
    const fileId = this.fileIdForKey(key);
    const { endpoint, headers } = this.getEndpointAndHeaders();

    await fetch(`${endpoint}/storage/buckets/${this.bucketId}/files/${fileId}`, {
      method: "DELETE",
      headers,
    });
  }
}

/* ------------------------------------------------------------------ */
/* 5. Cloudflare R2 Store (Native Worker Binding / S3 REST)            */
/* ------------------------------------------------------------------ */

class R2ObjectStore implements ObjectStore {
  constructor(
    private bucketName: string,
    private prefix: string,
  ) {}

  private resolveKey(key: string): string {
    const cleanKey = key.replace(/^\/+/, "");
    return `${this.prefix}/${cleanKey}`;
  }

  private async getWorkerBucket(): Promise<{
    put: (key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
    get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer>; size: number; httpMetadata?: { contentType?: string } } | null>;
    head: (key: string) => Promise<{ size: number; httpMetadata?: { contentType?: string } } | null>;
    delete: (key: string) => Promise<unknown>;
  } | null> {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const ctx = await getCloudflareContext({ async: true });
      const env = ctx.env as Record<string, unknown>;
      const r2 = env.R2_BUCKET;
      return (r2 as ReturnType<R2ObjectStore["getWorkerBucket"]> extends Promise<infer U> ? U : never) ?? null;
    } catch {
      return null;
    }
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<ObjectMetadata> {
    const fullKey = this.resolveKey(key);
    const bucket = await this.getWorkerBucket();
    if (!bucket) {
      // Reporting success here would record a resume row whose bytes were never
      // stored: the upload would appear to succeed, then fail on download or
      // attachment with no explanation. This happens when CLOUDFLARE_R2 is
      // enabled but no R2_BUCKET binding exists on the Worker.
      throw new Error("R2_BUCKET_BINDING_MISSING: object storage is unavailable");
    }
    await bucket.put(fullKey, bytes, { httpMetadata: { contentType } });
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    return {
      byteSize: bytes.length,
      sha256,
      contentType,
    };
  }

  async get(key: string): Promise<Uint8Array> {
    const fullKey = this.resolveKey(key);
    const bucket = await this.getWorkerBucket();
    if (bucket) {
      const obj = await bucket.get(fullKey);
      if (obj) {
        const ab = await obj.arrayBuffer();
        return new Uint8Array(ab);
      }
    }
    throw new Error(`R2 object not found: ${fullKey}`);
  }

  async metadata(key: string): Promise<ObjectMetadata | null> {
    const fullKey = this.resolveKey(key);
    const bucket = await this.getWorkerBucket();
    if (bucket) {
      const h = await bucket.head(fullKey);
      if (h) {
        return {
          byteSize: h.size,
          sha256: "",
          contentType: h.httpMetadata?.contentType ?? null,
        };
      }
    }
    return null;
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.resolveKey(key);
    const bucket = await this.getWorkerBucket();
    if (bucket) {
      await bucket.delete(fullKey);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Exported Factory resolving by priority:                             */
/* Cloudflare R2 > Appwrite > Supabase > Neon > Local                 */
/* ------------------------------------------------------------------ */

export function getObjectStore(bucket: "quarantine" | "clean" | "export"): ObjectStore {
  const config = getConfig();
  if (config.storageMode === "r2") {
    return new R2ObjectStore(config.CLOUDFLARE_R2_BUCKET || "resumes", bucket);
  }
  if (config.storageMode === "appwrite") {
    return new AppwriteStore(config.APPWRITE_BUCKET_ID || "resumes", bucket);
  }
  if (config.storageMode === "supabase") {
    return new SupabaseObjectStore(config.SUPABASE_STORAGE_BUCKET || "resumes", bucket);
  }
  if (config.storageMode === "neon") {
    return new NeonObjectStore(bucket);
  }
  return new LocalObjectStore(bucket);
}
