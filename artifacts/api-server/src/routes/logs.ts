import { Router, type IRouter } from "express";
import { db, logsTable } from "@workspace/db";
import { ListLogsQueryParams } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/logs", async (req, res): Promise<void> => {
  const parsed = ListLogsQueryParams.safeParse(req.query);
  const type = parsed.success ? parsed.data.type : undefined;
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;

  let query = db.select().from(logsTable).orderBy(desc(logsTable.createdAt)).limit(limit);

  if (type) {
    query = query.where(eq(logsTable.type, type)) as typeof query;
  }

  const logs = await query;
  res.json(logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })));
});

export default router;
