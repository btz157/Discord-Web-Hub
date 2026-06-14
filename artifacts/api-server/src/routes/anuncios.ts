import { Router, type IRouter } from "express";
import { db, anunciosTable } from "@workspace/db";
import { CreateAnuncioBody, DeleteAnuncioParams } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

function serializeAnuncio(a: typeof anunciosTable.$inferSelect) {
  return { ...a, sentAt: a.sentAt.toISOString() };
}

router.get("/anuncios", async (_req, res): Promise<void> => {
  const anuncios = await db.select().from(anunciosTable).orderBy(desc(anunciosTable.sentAt));
  res.json(anuncios.map(serializeAnuncio));
});

router.post("/anuncios", async (req, res): Promise<void> => {
  const parsed = CreateAnuncioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [anuncio] = await db.insert(anunciosTable).values(parsed.data).returning();
  res.status(201).json(serializeAnuncio(anuncio));
});

router.delete("/anuncios/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAnuncioParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(anunciosTable).where(eq(anunciosTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Anuncio not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
