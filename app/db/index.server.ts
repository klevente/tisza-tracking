import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.server";
import { neon } from "@neondatabase/serverless";
import { env } from "~/config/env.server";

const queryClient = neon(env.DATABASE_URL);
export const db = drizzle(queryClient, {
  schema,
});
