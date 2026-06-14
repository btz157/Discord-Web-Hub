import { Router, type IRouter } from "express";
import { db, ticketsTable } from "@workspace/db";
import {
  ListTicketsQueryParams,
  CreateTicketBody,
  GetTicketParams,
  UpdateTicketParams,
  UpdateTicketBody,
} from "@workspace/api-zod";
import { desc, eq, or } from "drizzle-orm";

const router: IRouter = Router();

function serializeTicket(t: typeof ticketsTable.$inferSelect) {
  return {
    ...t,
    closedAt: t.closedAt ? t.closedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/tickets", async (req, res): Promise<void> => {
  const parsed = ListTicketsQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : "all";

  let query = db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt));

  if (status === "open") {
    query = query.where(eq(ticketsTable.status, "open")) as typeof query;
  } else if (status === "closed") {
    query = query.where(eq(ticketsTable.status, "closed")) as typeof query;
  }

  const tickets = await query;
  res.json(tickets.map(serializeTicket));
});

router.post("/tickets", async (req, res): Promise<void> => {
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [ticket] = await db.insert(ticketsTable).values(parsed.data).returning();
  res.status(201).json(serializeTicket(ticket));
});

router.get("/tickets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTicketParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, params.data.id));
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(serializeTicket(ticket));
});

router.patch("/tickets/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateTicketParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof ticketsTable.$inferInsert> = {};
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.closedBy) updateData.closedBy = parsed.data.closedBy;
  if (parsed.data.status === "closed") updateData.closedAt = new Date();

  const [ticket] = await db
    .update(ticketsTable)
    .set(updateData)
    .where(eq(ticketsTable.id, params.data.id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(serializeTicket(ticket));
});

export default router;
