import { Router, type IRouter } from "express";

const router: IRouter = Router();

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Food & Dining", icon: "UtensilsCrossed", color: "#f97316" },
  { id: 2, name: "Transportation", icon: "Car", color: "#3b82f6" },
  { id: 3, name: "Shopping", icon: "ShoppingBag", color: "#8b5cf6" },
  { id: 4, name: "Entertainment", icon: "Tv", color: "#ec4899" },
  { id: 5, name: "Health & Fitness", icon: "Heart", color: "#ef4444" },
  { id: 6, name: "Housing", icon: "Home", color: "#06b6d4" },
  { id: 7, name: "Utilities", icon: "Zap", color: "#eab308" },
  { id: 8, name: "Education", icon: "GraduationCap", color: "#14b8a6" },
  { id: 9, name: "Savings", icon: "PiggyBank", color: "#22c55e" },
  { id: 10, name: "Salary", icon: "Briefcase", color: "#84cc16" },
  { id: 11, name: "Freelance", icon: "Laptop", color: "#a855f7" },
  { id: 12, name: "Investment", icon: "TrendingUp", color: "#10b981" },
  { id: 13, name: "Other Income", icon: "Plus", color: "#6366f1" },
  { id: 14, name: "Other Expense", icon: "Minus", color: "#6b7280" },
];

router.get("/categories", async (_req, res): Promise<void> => {
  res.json(DEFAULT_CATEGORIES);
});

export default router;
