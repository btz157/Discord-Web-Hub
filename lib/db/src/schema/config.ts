import { pgTable, text, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const configTable = pgTable("config", {
  guildId: text("guild_id").primaryKey(),
  prefix: text("prefix").notNull().default("!"),
  welcomeChannelId: text("welcome_channel_id"),
  logChannelId: text("log_channel_id"),
  modLogChannelId: text("mod_log_channel_id"),
  ticketCategoryId: text("ticket_category_id"),
  autoroleId: text("autorole_id"),
  xpEnabled: boolean("xp_enabled").notNull().default(true),
  xpMultiplier: real("xp_multiplier").notNull().default(1.0),
  maxWarns: integer("max_warns").notNull().default(3),
  muteRoleId: text("mute_role_id"),
});

export const insertConfigSchema = createInsertSchema(configTable);
export type InsertConfig = z.infer<typeof insertConfigSchema>;
export type Config = typeof configTable.$inferSelect;
