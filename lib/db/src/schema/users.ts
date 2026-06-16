import { pgTable, text, serial, timestamp, real, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const occupationEnum = pgEnum("occupation_type", [
  "salaried",
  "self_employed",
  "freelancer",
  "business_owner",
  "student",
  "retired",
  "other",
]);

export const accountTypeEnum = pgEnum("bank_account_type", [
  "savings",
  "current",
  "salary",
  "nri",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  otpCode: text("otp_code"),
  otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => usersTable.id),
  phone: text("phone"),
  occupation: occupationEnum("occupation"),
  employerName: text("employer_name"),
  monthlyIncome: real("monthly_income"),
  estimatedMonthlyExpenses: real("estimated_monthly_expenses"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountType: accountTypeEnum("account_type"),
  ifscCode: text("ifsc_code"),
  branchName: text("branch_name"),
  monthlyRent: real("monthly_rent"),
  emiAmount: real("emi_amount"),
  insurancePremium: real("insurance_premium"),
  financialGoal: text("financial_goal"),
  securityPin: text("security_pin"),
  profileCompleted: boolean("profile_completed").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({ id: true });

export type User = typeof usersTable.$inferSelect;
export type UserProfile = typeof userProfilesTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

// Session table for connect-pg-simple
import { varchar, json } from "drizzle-orm/pg-core";

export const sessionTable = pgTable("session", {
  sid: varchar("sid").notNull().primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});
