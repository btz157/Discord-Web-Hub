import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const xpTable = pgTable("xp", {
  discordId: text("discord_id").primaryKey(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
});

export const insertXpSchema = createInsertSchema(xpTable);
export type InsertXp = z.infer<typeof insertXpSchema>;
export type XpEntry = typeof xpTable.$inferSelect;
