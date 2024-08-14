import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

dotenv.config();

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "preview", "production"]),
    DATABASE_URL: z.string().url(),
    CRON_SECRET: z.string(),
    CHROME_PATH: z.string().optional(),
    THEME_SESSION_SECRET: z
      .string()
      .transform((s) => s.split(".").map((e) => e.trim())),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
