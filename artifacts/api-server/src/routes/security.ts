import { Router } from "express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  next();
}

const pinSchema = z.object({
  pin: z.string().min(4).max(6).regex(/^\d+$/),
});

router.get("/security/status", requireAuth, async (req, res) => {
  const userId = req.session!.userId;
  
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  
  // If the user doesn't have a profile yet, they have 0 linked accounts and no PIN.
  if (!profile) {
    return res.json({
      pinConfigured: false,
      linkedAccountsCount: 0
    });
  }

  // Count linked accounts (currently just checks if the primary bank account fields exist)
  const hasLinkedAccount = !!(profile.bankName || profile.accountNumber);
  
  return res.json({
    pinConfigured: !!profile.securityPin,
    linkedAccountsCount: hasLinkedAccount ? 1 : 0
  });
});

router.post("/security/pin", requireAuth, async (req, res) => {
  const parsed = pinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid PIN format" });

  const userId = req.session!.userId;
  const { pin } = parsed.data;

  const pinHash = await bcrypt.hash(pin, 10);

  const existing = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

  if (existing.length > 0) {
    await db
      .update(userProfilesTable)
      .set({ securityPin: pinHash, updatedAt: new Date() })
      .where(eq(userProfilesTable.userId, userId));
  } else {
    await db
      .insert(userProfilesTable)
      .values({ userId, securityPin: pinHash });
  }

  return res.json({ message: "Security PIN updated successfully" });
});

export default router;
