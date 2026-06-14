import { Router, type IRouter } from "express";
import { db, configTable } from "@workspace/db";
import { UpdateConfigBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? "default";

router.get("/config", async (_req, res): Promise<void> => {
  let [config] = await db.select().from(configTable).where(eq(configTable.guildId, GUILD_ID));

  if (!config) {
    [config] = await db.insert(configTable).values({ guildId: GUILD_ID }).returning();
  }

  res.json(config);
});

router.patch("/config", async (req, res): Promise<void> => {
  const parsed = UpdateConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(configTable).where(eq(configTable.guildId, GUILD_ID));
  let config;

  if (existing.length === 0) {
    [config] = await db.insert(configTable).values({ guildId: GUILD_ID, ...parsed.data }).returning();
  } else {
    [config] = await db.update(configTable).set(parsed.data).where(eq(configTable.guildId, GUILD_ID)).returning();
  }

  res.json(config);
});

export default router;
