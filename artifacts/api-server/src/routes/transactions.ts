import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  UpdateTransactionParams,
  GetTransactionParams,
  DeleteTransactionParams,
  ListTransactionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let conditions = [eq(transactionsTable.userId, req.session!.userId)];
  if (query.data.category) {
    conditions.push(eq(transactionsTable.category, query.data.category));
  }
  if (query.data.type) {
    conditions.push(eq(transactionsTable.type, query.data.type as "income" | "expense"));
  }

  const rows = await db
    .select()
    .from(transactionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(transactionsTable.createdAt);

  const limited = query.data.limit ? rows.slice(0, query.data.limit) : rows;
  res.json(limited.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [t] = await db.insert(transactionsTable).values({
    ...parsed.data,
    userId: req.session!.userId
  }).returning();
  res.status(201).json({ ...t, createdAt: t.createdAt.toISOString() });
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [t] = await db.select().from(transactionsTable).where(
    and(
      eq(transactionsTable.id, params.data.id),
      eq(transactionsTable.userId, req.session!.userId)
    )
  );
  if (!t) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json({ ...t, createdAt: t.createdAt.toISOString() });
});

router.patch("/transactions/:id", async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [t] = await db
    .update(transactionsTable)
    .set(parsed.data)
    .where(
      and(
        eq(transactionsTable.id, params.data.id),
        eq(transactionsTable.userId, req.session!.userId)
      )
    )
    .returning();

  if (!t) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json({ ...t, createdAt: t.createdAt.toISOString() });
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [t] = await db.delete(transactionsTable).where(
    and(
      eq(transactionsTable.id, params.data.id),
      eq(transactionsTable.userId, req.session!.userId)
    )
  ).returning();
  if (!t) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
