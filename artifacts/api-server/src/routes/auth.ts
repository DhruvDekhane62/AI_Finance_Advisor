import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password, fullName } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ email, passwordHash, fullName }).returning();

  req.session!.userId = user.id;

  return res.status(201).json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    profileCompleted: false,
    createdAt: user.createdAt,
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  req.session!.userId = user.id;

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, user.id)).limit(1);

  return res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    profileCompleted: profile?.profileCompleted ?? false,
    createdAt: user.createdAt,
  });
});

router.post("/auth/logout", (req, res) => {
  req.session!.destroy(() => {
    res.clearCookie("sid");
    return res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, user.id)).limit(1);

  return res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    profileCompleted: profile?.profileCompleted ?? false,
    createdAt: user.createdAt,
  });
});

export default router;
