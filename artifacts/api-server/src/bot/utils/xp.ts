import { db } from "@workspace/db";
import { xpTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import type { GuildMember } from "discord.js";

const XP_MIN = 15;
const XP_MAX = 25;
const XP_COOLDOWN_MS = 60_000;

const cooldowns = new Map<string, number>();

export function xpForLevel(level: number): number {
  return Math.pow(level / 0.1, 2);
}

export function levelFromXp(xp: number): number {
  return Math.floor(0.1 * Math.sqrt(xp));
}

export function xpToNextLevel(currentXp: number): number {
  const currentLevel = levelFromXp(currentXp);
  return xpForLevel(currentLevel + 1) - currentXp;
}

export async function addXp(
  discordId: string,
  username: string,
  avatarUrl: string | null,
  multiplier = 1.0,
): Promise<{ newXp: number; oldLevel: number; newLevel: number } | null> {
  const now = Date.now();
  const lastXp = cooldowns.get(discordId) ?? 0;
  if (now - lastXp < XP_COOLDOWN_MS) return null;
  cooldowns.set(discordId, now);

  const earned = Math.floor((XP_MIN + Math.random() * (XP_MAX - XP_MIN)) * multiplier);

  const existing = await db.select().from(xpTable).where(eq(xpTable.discordId, discordId)).limit(1);
  const current = existing[0] ?? { xp: 0, level: 1 };

  const oldLevel = current.level;
  const newXp = current.xp + earned;
  const newLevel = Math.max(1, levelFromXp(newXp));

  await db
    .insert(xpTable)
    .values({ discordId, username, avatarUrl, xp: newXp, level: newLevel })
    .onConflictDoUpdate({
      target: xpTable.discordId,
      set: { username, avatarUrl, xp: newXp, level: newLevel },
    });

  return { newXp, oldLevel, newLevel };
}
