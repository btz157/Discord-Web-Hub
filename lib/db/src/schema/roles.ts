import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rolesTable = pgTable("roles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roleId: text("role_id").notNull(),
  roleName: text("role_name").notNull(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull(),
  color: text("color"),
  memberCount: integer("member_count").notNull().default(0),
});

export const insertRoleSchema = createInsertSchema(rolesTable).omit({ id: true, memberCount: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof rolesTable.$inferSelect;
