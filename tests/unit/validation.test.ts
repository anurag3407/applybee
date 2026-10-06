import { describe, it, expect } from "vitest";
import {
  fillTemplate,
  findUnknownTemplateVariables,
  safeEmail,
  safeInternalPath,
  bodySchema,
  draftPatchSchema,
} from "@/lib/validation";
import { formatINRPaise, wordCount } from "@/lib/format";

describe("template placeholders", () => {
  it("fills known variables and reports missing", () => {
    const { filled, missing } = fillTemplate("Hi {{recipient_first_name}}, I'm {{candidate_name}}.", {
      recipient_first_name: "Priya",
    });
    expect(filled).toBe("Hi Priya, I'm {{candidate_name}}.");
    expect(missing).toEqual(["candidate_name"]);
  });

  it("leaves unknown variables untouched and flags them", () => {
    const unknown = findUnknownTemplateVariables("Hello {{custom_var}} and {{company_name}}", "");
    expect(unknown).toEqual(["custom_var"]);
  });
});

describe("input validation", () => {
  it("rejects header-injection emails", () => {
    expect(safeEmail.safeParse("ok@example.com").success).toBe(true);
    expect(safeEmail.safeParse("bad\r\nBcc: x@y.example").success).toBe(false);
    expect(safeEmail.safeParse("no-at-sign").success).toBe(false);
  });

  it("enforces body character and word caps", () => {
    expect(bodySchema.safeParse("short note").success).toBe(true);
    expect(bodySchema.safeParse("x".repeat(20_001)).success).toBe(false);
    const tooManyWords = Array.from({ length: 1_100 }, () => "w").join(" ");
    expect(bodySchema.safeParse(tooManyWords).success).toBe(false);
  });

  it("validates draft patch shape", () => {
    expect(draftPatchSchema.safeParse({ expectedVersion: 3, subject: "Hi" }).success).toBe(true);
    expect(draftPatchSchema.safeParse({ expectedVersion: -1 }).success).toBe(false);
  });

  // A draft created from the dashboard has no recipient, so setting one —
  // or clearing it — has to be expressible. This path was previously
  // unreachable: the PATCH route dropped recipient, which dead-ended the
  // primary "Create an introduction" call to action.
  const RECIPIENT_PATCHES: Array<[name: string, recipient: unknown, valid: boolean]> = [
    ["own recipient with email", { kind: "own", email: "priya@acme.example", name: "Priya" }, true],
    ["directory recipient by contact id", { kind: "directory", contactId: "3f1b7c66-2f2a-4a5e-9a2c-6f0f3d2a1b44" }, true],
    ["cleared recipient", { kind: "none" }, true],
    ["own recipient with malformed email", { kind: "own", email: "not-an-email" }, false],
    // A directory recipient must be a real uuid, not an arbitrary string.
    ["directory recipient with non-uuid id", { kind: "directory", contactId: "abc" }, false],
  ];
  it.each(RECIPIENT_PATCHES)("recipient patch: %s", (_name, recipient, valid) => {
    expect(draftPatchSchema.safeParse({ expectedVersion: 1, recipient }).success).toBe(valid);
  });

  // Same-origin return paths for auth redirects: absolute, protocol-relative,
  // backslash, and CRLF tricks are external navigations; repeated query params
  // arrive as arrays and are never valid paths.
  const RETURN_PATHS: Array<[name: string, value: unknown, expected: string | null]> = [
    ["same-origin path with query", "/app/drafts/1?tab=body", "/app/drafts/1?tab=body"],
    ["missing value", undefined, null],
    ["empty string", "", null],
    ["absolute external URL", "https://evil.example/app", null],
    ["protocol-relative URL", "//evil.example/app", null],
    ["backslash host trick", "/\\evil.example", null],
    ["CRLF injection", "/app\r\nLocation: https://evil.example", null],
    ["relative path", "relative/path", null],
    ["repeated query param (array)", ["/app"], null],
  ];
  it.each(RETURN_PATHS)("return path: %s", (_name, value, expected) => {
    expect(safeInternalPath(value)).toBe(expected);
  });
});

describe("formatting", () => {
  it("formats INR from paise", () => {
    expect(formatINRPaise(29900)).toMatch(/299/);
  });

  it("counts words", () => {
    expect(wordCount("one two three")).toBe(3);
    expect(wordCount("  ")).toBe(0);
  });
});
