import { Router, type IRouter } from "express";
import { db, sorteiosTable } from "@workspace/db";
import {
  CreateSorteioBody,
  GetSorteioParams,
  DeleteSorteioParams,
  DrawSorteioParams,
} from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

function serializeSorteio(s: typeof sorteiosTable.$inferSelect) {
  return {
    ...s,
    endAt: s.endAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/sorteios", async (_req, res): Promise<void> => {
  const sorteios = await db.select().from(sorteiosTable).orderBy(desc(sorteiosTable.createdAt));
  res.json(sorteios.map(serializeSorteio));
});

router.post("/sorteios", async (req, res): Promise<void> => {
  const parsed = CreateSorteioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sorteio] = await db.insert(sorteiosTable).values({
    ...parsed.data,
    endAt: new Date(parsed.data.endAt),
    winners: parsed.data.winners ?? 1,
  }).returning();

  res.status(201).json(serializeSorteio(sorteio));
});

router.get("/sorteios/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSorteioParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sorteio] = await db.select().from(sorteiosTable).where(eq(sorteiosTable.id, params.data.id));
  if (!sorteio) {
    res.status(404).json({ error: "Sorteio not found" });
    return;
  }

  res.json(serializeSorteio(sorteio));
});

router.delete("/sorteios/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteSorteioParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(sorteiosTable).where(eq(sorteiosTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Sorteio not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/sorteios/:id/draw", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DrawSorteioParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sorteio] = await db.select().from(sorteiosTable).where(eq(sorteiosTable.id, params.data.id));
  if (!sorteio) {
    res.status(404).json({ error: "Sorteio not found" });
    return;
  }

  const [updated] = await db
    .update(sorteiosTable)
    .set({ status: "ended" })
    .where(eq(sorteiosTable.id, params.data.id))
    .returning();

  res.json(serializeSorteio(updated));
});

export default router;
