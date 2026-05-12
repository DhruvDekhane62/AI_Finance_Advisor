import { Router, type IRouter } from "express";
import { db, transactionsTable, budgetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#f97316",
  "Transportation": "#3b82f6",
  "Shopping": "#8b5cf6",
  "Entertainment": "#ec4899",
  "Health & Fitness": "#ef4444",
  "Housing": "#06b6d4",
  "Utilities": "#eab308",
  "Education": "#14b8a6",
  "Savings": "#22c55e",
  "Salary": "#84cc16",
  "Freelance": "#a855f7",
  "Investment": "#10b981",
  "Other Income": "#6366f1",
  "Other Expense": "#6b7280",
};

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const all = await db.select().from(transactionsTable);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const totalIncome = all.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = all.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const thisMonthTransactions = all.filter((t) => t.date.startsWith(thisMonth));
  const thisMonthIncome = thisMonthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const thisMonthExpenses = thisMonthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  res.json({
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate: Math.round(savingsRate * 10) / 10,
    transactionCount: all.length,
    thisMonthIncome,
    thisMonthExpenses,
  });
});

router.get("/analytics/spending-by-category", async (_req, res): Promise<void> => {
  const expenses = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "expense"));

  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const byCategory: Record<string, number> = {};

  for (const t of expenses) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }

  const result = Object.entries(byCategory).map(([category, total]) => ({
    category,
    total: Math.round(total * 100) / 100,
    percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 1000) / 10 : 0,
    color: CATEGORY_COLORS[category] ?? "#6b7280",
  }));

  result.sort((a, b) => b.total - a.total);
  res.json(result);
});

router.get("/analytics/monthly-trend", async (_req, res): Promise<void> => {
  const all = await db.select().from(transactionsTable);
  const now = new Date();

  const months: { month: string; income: number; expenses: number; savings: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });

    const monthTx = all.filter((t) => t.date.startsWith(monthKey));
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    months.push({
      month: label,
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      savings: Math.round((income - expenses) * 100) / 100,
    });
  }

  res.json(months);
});

router.get("/analytics/predictions", async (_req, res): Promise<void> => {
  const all = await db.select().from(transactionsTable);
  const now = new Date();

  // Compute avg monthly expenses over last 3 months
  const monthlyExpenses: number[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthTotal = all
      .filter((t) => t.type === "expense" && t.date.startsWith(monthKey))
      .reduce((s, t) => s + t.amount, 0);
    monthlyExpenses.push(monthTotal);
  }

  const validMonths = monthlyExpenses.filter((m) => m > 0);
  const avgExpenses = validMonths.length > 0 ? validMonths.reduce((s, v) => s + v, 0) / validMonths.length : 0;

  // Weighted prediction: more weight on recent months
  const weights = [0.2, 0.3, 0.5];
  let predicted = 0;
  if (monthlyExpenses.length === 3) {
    predicted = monthlyExpenses.reduce((s, v, i) => s + v * weights[i], 0);
  } else {
    predicted = avgExpenses;
  }

  // Get current month expenses
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthExpenses = all
    .filter((t) => t.type === "expense" && t.date.startsWith(thisMonth))
    .reduce((s, t) => s + t.amount, 0);

  const totalIncome = all.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = all.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;

  const alerts: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: "low" | "medium" | "high" = "low";

  // Trend analysis
  if (monthlyExpenses[2] > monthlyExpenses[1] && monthlyExpenses[1] > monthlyExpenses[0]) {
    alerts.push("Your expenses have been increasing for 3 consecutive months.");
    riskLevel = "medium";
  }

  if (savingsRate < 0.1 && totalIncome > 0) {
    alerts.push("Your savings rate is below 10% — financial experts recommend saving at least 20%.");
    riskLevel = "high";
    recommendations.push("Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.");
  }

  if (thisMonthExpenses > predicted * 0.8) {
    alerts.push("You've already spent 80% of your predicted monthly budget.");
  }

  if (savingsRate > 0.3) {
    recommendations.push("Great savings rate! Consider investing your surplus in mutual funds or SIPs.");
  } else {
    recommendations.push("Set up automatic transfers to a savings account on payday.");
  }

  recommendations.push("Track discretionary spending categories to identify areas for reduction.");
  recommendations.push("Review subscriptions and recurring expenses quarterly.");

  if (alerts.length === 0) {
    alerts.push("Your spending pattern looks healthy this month.");
  }

  const confidenceLevel = validMonths.length >= 2 ? 75 : 50;

  res.json({
    predictedMonthlyExpense: Math.round(predicted * 100) / 100,
    confidenceLevel,
    riskLevel,
    alerts,
    recommendations,
  });
});

router.get("/analytics/budget-status", async (_req, res): Promise<void> => {
  const budgets = await db.select().from(budgetsTable);
  const transactions = await db.select().from(transactionsTable).where(eq(transactionsTable.type, "expense"));
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // For weekly, get current week start
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const result = budgets.map((b) => {
    let spent = 0;
    if (b.period === "monthly") {
      spent = transactions
        .filter((t) => t.category === b.category && t.date.startsWith(thisMonth))
        .reduce((s, t) => s + t.amount, 0);
    } else {
      spent = transactions
        .filter((t) => t.category === b.category && t.date >= weekStartStr)
        .reduce((s, t) => s + t.amount, 0);
    }

    const percentage = b.limit > 0 ? Math.min((spent / b.limit) * 100, 100) : 0;
    const remaining = Math.max(b.limit - spent, 0);
    let status: "safe" | "warning" | "exceeded" = "safe";
    if (spent > b.limit) status = "exceeded";
    else if (percentage >= 80) status = "warning";

    return {
      id: b.id,
      category: b.category,
      limit: b.limit,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      percentage: Math.round(percentage * 10) / 10,
      period: b.period,
      status,
    };
  });

  res.json(result);
});

export default router;
