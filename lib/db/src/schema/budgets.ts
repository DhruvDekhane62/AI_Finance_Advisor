import { pgTable, text, serial, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const budgetPeriodEnum = pgEnum("budget_period", ["monthly", "weekly"]);

export const budgetsTable = pgTable("budgets", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  limit: real("limit").notNull(),
  period: budgetPeriodEnum("period").notNull().default("monthly"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBudgetSchema = createInsertSchema(budgetsTable).omit({ id: true, createdAt: true });
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgetsTable.$inferSelect;
