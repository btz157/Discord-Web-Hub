import { db } from "@workspace/db";
import { configTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import type { Config } from "@workspace/db/schema";

const cache = new Map<string, Config>();

export async function getConfig(guildId: string): Promise<Config | null> {
  if (cache.has(guildId)) return cache.get(guildId)!;
  const rows = await db.select().from(configTable).where(eq(configTable.guildId, guildId)).limit(1);
  if (rows[0]) cache.set(guildId, rows[0]);
  return rows[0] ?? null;
}

export function invalidateConfig(guildId: string) {
  cache.delete(guildId);
}
