import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

dotenv.config();

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "preview", "production"]),
    DATABASE_URL: z.string().url(),
    CHROME_PATH: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
