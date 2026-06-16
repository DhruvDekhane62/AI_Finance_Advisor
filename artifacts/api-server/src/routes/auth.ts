import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4 resolution to fix ENETUNREACH errors on IPv4-only environments (like Render) when connecting to Gmail.
dns.setDefaultResultOrder("ipv4first");
import { seedUserData } from "../lib/seed";

const router = Router();

// Use explicit Gmail SMTP settings — more reliable than service: 'gmail'
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  family: 4, // Force IPv4 to avoid ENETUNREACH on environments without proper IPv6 routing
  auth: {
    user: process.env.SMTP_USER?.replace(/^"|"$/g, ""),
    pass: process.env.SMTP_PASS?.replace(/^"|"$/g, ""),
  },
});

// Verify SMTP connection on startup so errors appear in logs immediately
transporter.verify((err) => {
  if (err) {
    console.error("[EMAIL] SMTP connection failed:", err.message);
    console.error("[EMAIL] Check SMTP_USER and SMTP_PASS in .env");
  } else {
    console.log("[EMAIL] SMTP connection verified — ready to send emails");
  }
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const resendOtpSchema = z.object({
  email: z.string().email(),
});

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password, fullName } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    if (!existing[0].isVerified) {
      // Regenerate a fresh OTP for unverified existing user
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await db.update(usersTable)
        .set({ otpCode, otpExpiresAt })
        .where(eq(usersTable.id, existing[0].id));
      return res.status(409).json({
        error: "Account exists but not verified. Please verify your email.",
        requiresOtp: true,
      });
    }
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const [user] = await db.insert(usersTable).values({ 
    email, 
    passwordHash, 
    fullName,
    otpCode,
    otpExpiresAt,
    isVerified: false
  }).returning();

  console.log(`[TESTING] Generated OTP for ${email}: ${otpCode}`);

  // Send real email via nodemailer in the background (non-blocking)
  transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify your account",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: auto;">
        <h2>ClearFin Account Verification</h2>
        <p>Thank you for signing up! Please use the following 6-digit code to verify your email address.</p>
        <div style="font-size: 32px; font-weight: bold; padding: 10px; background: #f4f4f4; border-radius: 8px; letter-spacing: 5px;">
          ${otpCode}
        </div>
        <p style="color: gray; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
      </div>
    `,
  })
  .then(() => console.log(`[EMAIL] OTP sent to ${email}`))
  .catch((error) => console.error("[EMAIL ERROR] Failed to send email:", error));

  return res.status(201).json({
    email: user.email,
    message: "OTP sent. (Testing: Use 123456 to bypass)",
    requiresOtp: true,
  });
});

router.post("/auth/verify-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, otp } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const isFirstTime = !user.isVerified;

  if (user.otpCode !== otp && otp !== "123456") return res.status(400).json({ error: "Invalid OTP" });

  if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
    return res.status(400).json({ error: "OTP has expired" });
  }

  // Mark as verified
  const [updatedUser] = await db.update(usersTable)
    .set({ isVerified: true, otpCode: null, otpExpiresAt: null })
    .where(eq(usersTable.id, user.id))
    .returning();

  if (isFirstTime) {
    // Seed dummy data for this user only on initial registration
    await seedUserData(updatedUser.id);
  }

  req.session!.userId = updatedUser.id;

  return res.json({
    id: updatedUser.id,
    email: updatedUser.email,
    fullName: updatedUser.fullName,
    profileCompleted: false,
    createdAt: updatedUser.createdAt,
  });
});

router.post("/auth/resend-otp", async (req, res) => {
  const parsed = resendOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.isVerified) return res.status(400).json({ error: "Account is already verified" });

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.update(usersTable)
    .set({ otpCode, otpExpiresAt })
    .where(eq(usersTable.id, user.id));

  console.log(`[TESTING] Resent OTP for ${email}: ${otpCode}`);

  // Send real email via nodemailer in the background (non-blocking)
  transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify your account (Resend)",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: auto;">
        <h2>ClearFin Account Verification</h2>
        <p>You requested a new verification code. Please use the following 6-digit code to verify your email address.</p>
        <div style="font-size: 32px; font-weight: bold; padding: 10px; background: #f4f4f4; border-radius: 8px; letter-spacing: 5px;">
          ${otpCode}
        </div>
        <p style="color: gray; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
      </div>
    `,
  })
  .then(() => console.log(`[EMAIL] Resent OTP to ${email}`))
  .catch((error) => console.error("[EMAIL ERROR] Failed to resend email:", error));

  return res.json({ message: "OTP resent successfully" });
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  // Auto-send a fresh OTP so the user can verify for login
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.update(usersTable)
    .set({ otpCode, otpExpiresAt })
    .where(eq(usersTable.id, user.id));
    
  console.log(`[TESTING] Login OTP for ${email}: ${otpCode}`);
    
  // Send real email via nodemailer in the background (non-blocking)
  transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Your ClearFin Login Code",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: auto;">
        <h2>ClearFin Login Verification</h2>
        <p>Use the code below to securely log in to your account.</p>
        <div style="font-size: 32px; font-weight: bold; padding: 10px; background: #f4f4f4; border-radius: 8px; letter-spacing: 5px;">
          ${otpCode}
        </div>
        <p style="color: gray; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
      </div>
    `,
  })
  .then(() => console.log(`[EMAIL] OTP auto-sent for login to ${email}`))
  .catch((error) => console.error("[EMAIL ERROR] Failed to send OTP on login:", error));
  return res.status(403).json({ error: "OTP Required", requiresOtp: true });
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
