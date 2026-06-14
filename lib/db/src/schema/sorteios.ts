import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sorteiosTable = pgTable("sorteios", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prize: text("prize").notNull(),
  description: text("description"),
  channelId: text("channel_id"),
  messageId: text("message_id"),
  createdBy: text("created_by").notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("active"),
  winners: integer("winners").notNull().default(1),
  participants: integer("participants").notNull().default(0),
  winnerIds: text("winner_ids").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSorteioSchema = createInsertSchema(sorteiosTable).omit({ id: true, createdAt: true, participants: true, winnerIds: true });
export type InsertSorteio = z.infer<typeof insertSorteioSchema>;
export type Sorteio = typeof sorteiosTable.$inferSelect;
