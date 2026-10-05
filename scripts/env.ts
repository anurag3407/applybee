/**
 * Shared env loader for maintenance scripts. Next.js gives `.env.local`
 * precedence over `.env` for the app; scripts must see the same view or
 * `pnpm db:migrate` would target the remote `.env` database while the dev
 * app runs against the local one. Shell-exported variables always win
 * (dotenv never overrides already-set process.env values).
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
