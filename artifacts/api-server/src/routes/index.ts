import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import categoriesRouter from "./categories";
import chatRouter from "./chat";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(budgetsRouter);
router.use(categoriesRouter);
router.use(chatRouter);
router.use(analyticsRouter);

export default router;
