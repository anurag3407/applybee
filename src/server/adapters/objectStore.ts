import "server-only";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getConfig } from "@/server/config";

/**
 * Object store adapter (§6.2).
 * Supports:
 * 1. Supabase Storage (100% free tier, zero credit card)
 * 2. Cloudflare R2 (when CLOUDFLARE_R2=true)
 * 3. Local filesystem (development fallback)
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

class SupabaseObjectStore implements ObjectStore {
  private client: SupabaseClient | null = null;

  constructor(
    private bucketName: string,
    private prefix: string
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

class R2ObjectStore implements ObjectStore {
  constructor(
    private bucketName: string,
    private prefix: string
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
    if (bucket) {
      await bucket.put(fullKey, bytes, { httpMetadata: { contentType } });
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

export function getObjectStore(bucket: "quarantine" | "clean" | "export"): ObjectStore {
  const config = getConfig();
  if (config.storageMode === "r2") {
    return new R2ObjectStore(config.CLOUDFLARE_R2_BUCKET || "resumes", bucket);
  }
  if (config.storageMode === "supabase") {
    return new SupabaseObjectStore(config.SUPABASE_STORAGE_BUCKET || "resumes", bucket);
  }
  return new LocalObjectStore(bucket);
}
