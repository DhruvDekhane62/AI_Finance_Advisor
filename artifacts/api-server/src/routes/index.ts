import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import categoriesRouter from "./categories";
import chatRouter from "./chat";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(transactionsRouter);
router.use(budgetsRouter);
router.use(categoriesRouter);
router.use(chatRouter);
router.use(analyticsRouter);

export default router;
