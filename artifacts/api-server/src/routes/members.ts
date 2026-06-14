import { Router, type IRouter } from "express";
import { db, xpTable } from "@workspace/db";
import { ListMembersQueryParams, GetMemberParams } from "@workspace/api-zod";
import { ilike, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/members", async (req, res): Promise<void> => {
  const parsed = ListMembersQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const search = parsed.success ? (parsed.data.search ?? "") : "";
  const limit = 20;
  const offset = (page - 1) * limit;

  const { sql } = await import("drizzle-orm");

  let query = db.select().from(xpTable);
  let countQuery = db.select({ count: count() }).from(xpTable);

  if (search) {
    const searchFilter = ilike(xpTable.username, `%${search}%`);
    query = query.where(searchFilter) as typeof query;
    countQuery = countQuery.where(searchFilter) as typeof countQuery;
  }

  const [members, totalResult] = await Promise.all([
    query.limit(limit).offset(offset),
    countQuery,
  ]);

  const total = totalResult[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  res.json({
    members: members.map((m) => ({
      discordId: m.discordId,
      username: m.username,
      displayName: null,
      avatarUrl: m.avatarUrl ?? null,
      roles: [],
      xp: m.xp,
      level: m.level,
      warns: 0,
      joinedAt: new Date().toISOString(),
    })),
    total,
    page,
    totalPages,
  });
});

router.get("/members/:discordId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.discordId) ? req.params.discordId[0] : req.params.discordId;
  const params = GetMemberParams.safeParse({ discordId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { eq } = await import("drizzle-orm");
  const [member] = await db.select().from(xpTable).where(eq(xpTable.discordId, params.data.discordId));

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.json({
    discordId: member.discordId,
    username: member.username,
    displayName: null,
    avatarUrl: member.avatarUrl ?? null,
    roles: [],
    xp: member.xp,
    level: member.level,
    warns: 0,
    joinedAt: new Date().toISOString(),
  });
});

export default router;
