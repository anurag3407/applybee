// Ensures the test database has migrations applied before integration tests.
import "dotenv/config";

process.env.DATABASE_URL ??= process.env.TEST_DATABASE_URL ?? "postgresql://localhost:5432/applybee_test";
process.env.TOKEN_ENCRYPTION_KEY ??= "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8="; // deterministic 32-byte dev key

export {};
