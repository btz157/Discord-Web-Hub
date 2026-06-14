import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { warnsTable, ticketsTable, sorteiosTable, xpTable, activityTable } from "@workspace/db";
import { count, sum, eq, desc } from "drizzle-orm";
import { GetDashboardStatsResponse, GetDashboardActivityResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const [warnCount] = await db.select({ count: count() }).from(warnsTable);
  const [ticketCount] = await db.select({ count: count() }).from(ticketsTable).where(eq(ticketsTable.status, "open"));
  const [sorteioCount] = await db.select({ count: count() }).from(sorteiosTable).where(eq(sorteiosTable.status, "active"));
  const [xpSum] = await db.select({ total: sum(xpTable.xp) }).from(xpTable);
  const [memberCount] = await db.select({ count: count() }).from(xpTable);

  const stats = {
    totalMembers: memberCount?.count ?? 0,
    onlineMembers: 0,
    openTickets: ticketCount?.count ?? 0,
    activeWarns: warnCount?.count ?? 0,
    totalXpGiven: parseInt(String(xpSum?.total ?? "0")) || 0,
    sorteiosAtivos: sorteioCount?.count ?? 0,
    botUptime: null,
    botStatus: "Online",
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const items = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.timestamp))
    .limit(20);

  res.json(GetDashboardActivityResponse.parse(
    items.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      timestamp: a.timestamp.toISOString(),
      discordId: a.discordId ?? null,
      username: a.username ?? null,
      avatarUrl: a.avatarUrl ?? null,
    }))
  ));
});

export default router;
