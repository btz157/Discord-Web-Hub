import { Router, type IRouter } from "express";
import { db, rolesTable } from "@workspace/db";
import { CreateRoleBody, DeleteRoleParams } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/roles", async (_req, res): Promise<void> => {
  const roles = await db.select().from(rolesTable);
  res.json(roles);
});

router.post("/roles", async (req, res): Promise<void> => {
  const parsed = CreateRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [role] = await db.insert(rolesTable).values(parsed.data).returning();
  res.status(201).json(role);
});

router.delete("/roles/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteRoleParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(rolesTable).where(eq(rolesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Role not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
