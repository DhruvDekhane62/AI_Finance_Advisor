import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Wallet, Eye, EyeOff, ShieldCheck, Timer } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useToast } from "@/hooks/use-toast";

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"login" | "otp">("login");
  const [otp, setOtp] = useState("");

  // Countdown timer: 10 minutes = 600 seconds
  const [countdown, setCountdown] = useState(600);
  // Resend cooldown: 60 seconds after a resend/initial send
  const [resendCooldown, setResendCooldown] = useState(0);

  // Start countdown when OTP step begins
  useEffect(() => {
    if (step !== "otp") return;
    setCountdown(600);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Resend button cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((c) => Math.max(c - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerifyOtp = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Verification failed", variant: "destructive" });
        return;
      }
      login(data);
      toast({ title: "Account verified! Welcome back 🎉" });
      if (!data.profileCompleted) {
        navigate("/onboarding");
      } else {
        navigate("/");
      }
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [email, login, navigate, toast]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerifyOtp(otp);
    }
  }, [otp, handleVerifyOtp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresOtp) {
          setStep("otp");
          setResendCooldown(60);
          toast({ title: "Check your email for the OTP" });
          return;
        }
        toast({ title: data.error || "Login failed", variant: "destructive" });
        return;
      }
      login(data);
      if (!data.profileCompleted) {
        navigate("/onboarding");
      } else {
        navigate("/");
      }
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to resend OTP", variant: "destructive" });
        return;
      }
      setOtp("");
      setCountdown(600);
      setResendCooldown(60);
      toast({ title: "New OTP sent to your email" });
    } catch {
      toast({ title: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/landing">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-xl cursor-pointer">
              <Wallet className="w-6 h-6" />
              ClearFin
            </div>
          </Link>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              {step === "login"
                ? <Wallet className="w-10 h-10 text-primary" />
                : <ShieldCheck className="w-10 h-10 text-primary" />}
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === "login" ? "Welcome back" : "2-Step Verification"}
            </CardTitle>
            <CardDescription>
              {step === "login"
                ? "Sign in to your ClearFin account"
                : <span>Enter the 6-digit code sent to<br /><strong>{email}</strong></span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {step === "login" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* OTP Input */}
                <div className="flex flex-col items-center gap-4">

                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    pattern={REGEXP_ONLY_DIGITS}
                    disabled={isLoading || countdown === 0}
                    autoFocus
                    autoComplete="off"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>

                  {/* Countdown Timer */}
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${countdown === 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    <Timer className="w-3.5 h-3.5" />
                    {countdown > 0
                      ? <span>Code expires in <strong>{formatCountdown(countdown)}</strong></span>
                      : <span>Code expired — please resend</span>}
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={isLoading || otp.length !== 6}
                  onClick={() => handleVerifyOtp(otp)}
                >
                  {isLoading ? "Verifying..." : "Verify Account"}
                </Button>

                {/* Resend + Back */}
                <div className="text-center space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground inline">Didn't receive the code? </p>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading || resendCooldown > 0}
                      className="text-sm text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => { setStep("login"); setOtp(""); }}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      ← Back to login
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "login" && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Create one free
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
