import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const warnsTable = pgTable("warns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  discordId: text("discord_id").notNull(),
  username: text("username").notNull(),
  reason: text("reason").notNull(),
  moderatorId: text("moderator_id").notNull(),
  moderatorName: text("moderator_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWarnSchema = createInsertSchema(warnsTable).omit({ id: true, createdAt: true });
export type InsertWarn = z.infer<typeof insertWarnSchema>;
export type Warn = typeof warnsTable.$inferSelect;
