import { defineConfig } from "drizzle-kit";
import { env } from "~/config/env.server";

export default defineConfig({
  dialect: "postgresql", // 'postgresql' | 'mysql' | 'sqlite'
  schema: "./app/db/schema.server.ts",
  out: "./app/db/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
