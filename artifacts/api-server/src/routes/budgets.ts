import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, budgetsTable } from "@workspace/db";
import {
  CreateBudgetBody,
  UpdateBudgetBody,
  UpdateBudgetParams,
  DeleteBudgetParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/budgets", async (_req, res): Promise<void> => {
  const rows = await db.select().from(budgetsTable).orderBy(budgetsTable.createdAt);
  res.json(rows.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() })));
});

router.post("/budgets", async (req, res): Promise<void> => {
  const parsed = CreateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [b] = await db.insert(budgetsTable).values(parsed.data).returning();
  res.status(201).json({ ...b, createdAt: b.createdAt.toISOString() });
});

router.patch("/budgets/:id", async (req, res): Promise<void> => {
  const params = UpdateBudgetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [b] = await db
    .update(budgetsTable)
    .set(parsed.data)
    .where(eq(budgetsTable.id, params.data.id))
    .returning();

  if (!b) {
    res.status(404).json({ error: "Budget not found" });
    return;
  }
  res.json({ ...b, createdAt: b.createdAt.toISOString() });
});

router.delete("/budgets/:id", async (req, res): Promise<void> => {
  const params = DeleteBudgetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [b] = await db.delete(budgetsTable).where(eq(budgetsTable.id, params.data.id)).returning();
  if (!b) {
    res.status(404).json({ error: "Budget not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
