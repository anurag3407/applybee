import { describe, it, expect } from "vitest";
import {
  fillTemplate,
  findUnknownTemplateVariables,
  safeEmail,
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
});

describe("formatting", () => {
  it("formats INR from paise", () => {
    expect(formatINRPaise(29900)).toMatch(/299/);
    expect(wordCount("one two three")).toBe(3);
    expect(wordCount("  ")).toBe(0);
  });
});
