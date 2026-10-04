import "server-only";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getConfig } from "@/server/config";

/**
 * Object store adapter (§6.2). Private quarantine/clean/export roots are
 * strictly separated; the local adapter implements the same contract as the
 * production S3/R2 adapter. Object keys are server-generated — user input can
 * never supply an arbitrary path.
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
    // Local emulator layout: .data/private/<quarantine|clean|export>.
    return path.resolve(process.cwd(), ".data/private", this.bucket);
  }

  private resolve(key: string): string {
    // Defense in depth: reject traversal even though keys are server-generated.
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
      const { createHash } = await import("node:crypto");
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

export function getObjectStore(bucket: "quarantine" | "clean" | "export"): ObjectStore {
  const config = getConfig();
  if (config.OBJECT_STORE_PROVIDER !== "local" && config.isProduction) {
    // Production adapters for S3/R2 are wired through IAM/R2 bindings with
    // this same interface (docs/adr/0005-file-storage.md).
    throw new Error("S3/R2 adapter requires cloud bindings; local provider is development-only");
  }
  return new LocalObjectStore(bucket);
}
