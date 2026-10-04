import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Integration tests run serially to keep DB state deterministic.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    setupFiles: ["tests/setup/vitest-setup.ts"],
    env: {
      APP_ENV: "development",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://localhost:5432/applybee_test",
      TOKEN_ENCRYPTION_KEY_VERSION: "1",
      FEATURE_AI_ENABLED: "true",
      FEATURE_GMAIL_ENABLED: "true",
      FEATURE_LIVE_PURCHASES_ENABLED: "false",
      FEATURE_RESUME_ATTACHMENTS_ENABLED: "true",
      AI_PROMPT_VERSION: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // server-only guards bundle boundaries; in Node tests it's a no-op.
      "server-only": path.resolve(__dirname, "./tests/setup/server-only-stub.ts"),
    },
  },
});
