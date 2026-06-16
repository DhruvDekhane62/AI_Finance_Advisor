import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import categoriesRouter from "./categories";
import chatRouter from "./chat";
import analyticsRouter from "./analytics";
import securityRouter from "./security";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  next();
}

router.use(healthRouter);
router.use(authRouter);

// Protect all other routes
router.use(requireAuth);
router.use(profileRouter);
router.use(transactionsRouter);
router.use(budgetsRouter);
router.use(categoriesRouter);
router.use(chatRouter);
router.use(analyticsRouter);
router.use(securityRouter);

export default router;
