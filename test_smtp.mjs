// Test SMTP email sending directly
// Run with: node test_smtp.mjs
import nodemailer from "nodemailer";
import { readFileSync } from "fs";

// Parse .env manually (strip quotes)
const env = Object.fromEntries(
  readFileSync(".env", "utf-8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const eqIdx = line.indexOf("=");
      const key = line.slice(0, eqIdx).trim();
      const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      return [key, value];
    })
);

const { SMTP_USER, SMTP_PASS } = env;
console.log("SMTP_USER:", SMTP_USER);
console.log("SMTP_PASS length:", SMTP_PASS?.length, "(expected 16 for App Password)");

if (!SMTP_USER || !SMTP_PASS) {
  console.error("❌ SMTP_USER or SMTP_PASS not found in .env");
  process.exit(1);
}

// Use explicit Gmail SMTP settings (more reliable than service: 'gmail')
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

try {
  console.log("\n📡 Verifying SMTP connection...");
  await transporter.verify();
  console.log("✅ SMTP connection OK!\n");

  console.log(`📧 Sending test email to ${SMTP_USER}...`);
  const info = await transporter.sendMail({
    from: SMTP_USER,
    to: SMTP_USER, // send to self
    subject: "ClearFin - SMTP Test",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: auto;">
        <h2>✅ SMTP is working!</h2>
        <p>Your test OTP code is:</p>
        <div style="font-size: 32px; font-weight: bold; padding: 10px; background: #f4f4f4; border-radius: 8px; letter-spacing: 5px;">
          123456
        </div>
        <p style="color: gray; font-size: 14px; margin-top: 20px;">This is a test email from ClearFin.</p>
      </div>
    `,
  });
  console.log("✅ Test email sent! Message ID:", info.messageId);
  console.log("\nIf you received this email, SMTP is working correctly.");
  console.log("If not, check your spam folder or verify your App Password.");
} catch (err) {
  console.error("\n❌ SMTP Error:", err.message);
  if (err.message.includes("Invalid login") || err.message.includes("535")) {
    console.error("\n🔑 FIX: Your Gmail App Password appears to be wrong.");
    console.error("   1. Go to: https://myaccount.google.com/apppasswords");
    console.error("   2. Create a new App Password for 'Mail'");
    console.error("   3. Update SMTP_PASS in your .env file");
    console.error("   4. Make sure 2-Step Verification is enabled on your Google account");
  } else if (err.message.includes("ECONNREFUSED") || err.message.includes("connect")) {
    console.error("\n🌐 FIX: Network issue. Check your internet connection.");
  }
  process.exit(1);
}
