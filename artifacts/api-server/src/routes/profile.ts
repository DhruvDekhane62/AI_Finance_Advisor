import { Router } from "express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const profileInputSchema = z.object({
  phone: z.string().optional(),
  occupation: z.enum(["salaried", "self_employed", "freelancer", "business_owner", "student", "retired", "other"] as const).optional(),
  employerName: z.string().optional(),
  monthlyIncome: z.number().optional(),
  estimatedMonthlyExpenses: z.number().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountType: z.enum(["savings", "current", "salary", "nri"] as const).optional(),
  ifscCode: z.string().optional(),
  branchName: z.string().optional(),
  monthlyRent: z.number().optional(),
  emiAmount: z.number().optional(),
  insurancePremium: z.number().optional(),
  financialGoal: z.string().optional(),
  profileCompleted: z.boolean().optional(),
});

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  next();
}

router.get("/profile", requireAuth, async (req, res) => {
  const userId = req.session!.userId;
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  return res.json(profile);
});

router.put("/profile", requireAuth, async (req, res) => {
  const parsed = profileInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const userId = req.session!.userId;
  const data = parsed.data;

  const existing = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(userProfilesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfilesTable.userId, userId))
      .returning();
    return res.json(updated);
  } else {
    const [created] = await db
      .insert(userProfilesTable)
      .values({ userId, ...data })
      .returning();
    return res.json(created);
  }
});

export default router;
