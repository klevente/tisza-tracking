import { integer, pgTable, timestamp } from "drizzle-orm/pg-core";

export const members = pgTable("members", {
  recordedAt: timestamp("recorded_at", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .primaryKey(),
  memberCount: integer("member_count").notNull(),
});

export type Member = typeof members.$inferSelect;
