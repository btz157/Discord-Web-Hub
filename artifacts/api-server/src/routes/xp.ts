import { Router, type IRouter } from "express";
import { db, xpTable } from "@workspace/db";
import { GetXpLeaderboardQueryParams, GetMemberXpParams, UpdateMemberXpParams, UpdateMemberXpBody } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/xp/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetXpLeaderboardQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const entries = await db
    .select()
    .from(xpTable)
    .orderBy(desc(xpTable.xp))
    .limit(limit);

  res.json(entries.map((e, idx) => ({
    discordId: e.discordId,
    username: e.username,
    avatarUrl: e.avatarUrl ?? null,
    xp: e.xp,
    level: e.level,
    rank: idx + 1,
  })));
});

router.get("/xp/:discordId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.discordId) ? req.params.discordId[0] : req.params.discordId;
  const params = GetMemberXpParams.safeParse({ discordId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db.select().from(xpTable).where(eq(xpTable.discordId, params.data.discordId));
  if (!entry) {
    res.status(404).json({ error: "XP entry not found" });
    return;
  }

  res.json({ ...entry, rank: null });
});

router.patch("/xp/:discordId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.discordId) ? req.params.discordId[0] : req.params.discordId;
  const params = UpdateMemberXpParams.safeParse({ discordId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMemberXpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof xpTable.$inferInsert> = {};
  if (parsed.data.xp !== undefined) updateData.xp = parsed.data.xp;
  if (parsed.data.level !== undefined) updateData.level = parsed.data.level;

  const [entry] = await db
    .update(xpTable)
    .set(updateData)
    .where(eq(xpTable.discordId, params.data.discordId))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "XP entry not found" });
    return;
  }

  res.json({ ...entry, rank: null });
});

export default router;
