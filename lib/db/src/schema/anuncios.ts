import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const anunciosTable = pgTable("anuncios", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  channelId: text("channel_id").notNull(),
  createdBy: text("created_by").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  pingRole: text("ping_role"),
  embedColor: text("embed_color"),
});

export const insertAnuncioSchema = createInsertSchema(anunciosTable).omit({ id: true, sentAt: true });
export type InsertAnuncio = z.infer<typeof insertAnuncioSchema>;
export type Anuncio = typeof anunciosTable.$inferSelect;
