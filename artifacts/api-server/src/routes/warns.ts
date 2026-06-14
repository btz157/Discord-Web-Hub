import { Router, type IRouter } from "express";
import { db, warnsTable, logsTable } from "@workspace/db";
import { ListWarnsQueryParams, CreateWarnBody, DeleteWarnParams } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/warns", async (req, res): Promise<void> => {
  const parsed = ListWarnsQueryParams.safeParse(req.query);
  const discordId = parsed.success ? parsed.data.discordId : undefined;

  let query = db.select().from(warnsTable).orderBy(desc(warnsTable.createdAt));

  if (discordId) {
    query = query.where(eq(warnsTable.discordId, discordId)) as typeof query;
  }

  const warns = await query;
  res.json(warns.map((w) => ({ ...w, createdAt: w.createdAt.toISOString() })));
});

router.post("/warns", async (req, res): Promise<void> => {
  const parsed = CreateWarnBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [warn] = await db.insert(warnsTable).values(parsed.data).returning();

  await db.insert(logsTable).values({
    type: "moderation",
    action: `Warn dado a ${parsed.data.username}`,
    moderatorId: parsed.data.moderatorId,
    moderatorName: parsed.data.moderatorName,
    targetId: parsed.data.discordId,
    targetName: parsed.data.username,
    reason: parsed.data.reason,
  });

  res.status(201).json({ ...warn, createdAt: warn.createdAt.toISOString() });
});

router.delete("/warns/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteWarnParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(warnsTable).where(eq(warnsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Warn not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
