import { useState } from "react";
import { useLocation } from "wouter";
import { Wallet, User, Briefcase, Building2, Target, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/format";

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Employment", icon: Briefcase },
  { id: 3, label: "Bank", icon: Building2 },
  { id: 4, label: "Goals", icon: Target },
];

const OCCUPATIONS = [
  { value: "salaried", label: "Salaried Employee" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "freelancer", label: "Freelancer" },
  { value: "business_owner", label: "Business Owner" },
  { value: "student", label: "Student" },
  { value: "retired", label: "Retired" },
  { value: "other", label: "Other" },
];

const ACCOUNT_TYPES = [
  { value: "savings", label: "Savings Account" },
  { value: "current", label: "Current Account" },
  { value: "salary", label: "Salary Account" },
  { value: "nri", label: "NRI Account" },
];

const FINANCIAL_GOALS = [
  { value: "emergency_fund", label: "Build Emergency Fund" },
  { value: "buy_home", label: "Buy a Home" },
  { value: "buy_vehicle", label: "Buy a Vehicle" },
  { value: "retirement", label: "Plan for Retirement" },
  { value: "education", label: "Fund Education" },
  { value: "wealth_building", label: "Build Wealth / Invest" },
  { value: "debt_free", label: "Become Debt-Free" },
  { value: "travel", label: "Travel Fund" },
];

interface FormData {
  phone: string;
  occupation: string;
  employerName: string;
  monthlyIncome: string;
  estimatedMonthlyExpenses: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  ifscCode: string;
  branchName: string;
  monthlyRent: string;
  emiAmount: string;
  insurancePremium: string;
  financialGoal: string;
}

const initial: FormData = {
  phone: "",
  occupation: "",
  employerName: "",
  monthlyIncome: "",
  estimatedMonthlyExpenses: "",
  bankName: "",
  accountNumber: "",
  accountType: "",
  ifscCode: "",
  branchName: "",
  monthlyRent: "",
  emiAmount: "",
  insurancePremium: "",
  financialGoal: "",
};

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initial);
  const [isLoading, setIsLoading] = useState(false);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setSelect = (field: keyof FormData) => (val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        phone: form.phone || undefined,
        occupation: form.occupation || undefined,
        employerName: form.employerName || undefined,
        monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : undefined,
        estimatedMonthlyExpenses: form.estimatedMonthlyExpenses ? Number(form.estimatedMonthlyExpenses) : undefined,
        bankName: form.bankName || undefined,
        accountNumber: form.accountNumber || undefined,
        accountType: form.accountType || undefined,
        ifscCode: form.ifscCode || undefined,
        branchName: form.branchName || undefined,
        monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
        emiAmount: form.emiAmount ? Number(form.emiAmount) : undefined,
        insurancePremium: form.insurancePremium ? Number(form.insurancePremium) : undefined,
        financialGoal: form.financialGoal || undefined,
        profileCompleted: true,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast({ title: "Failed to save profile. Please try again.", variant: "destructive" });
        return;
      }

      await refreshUser();
      navigate("/");
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 text-primary font-semibold text-lg mb-8">
        <Wallet className="w-5 h-5" />
        ClearFin
      </div>

      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      isActive && "border-primary bg-primary text-primary-foreground",
                      isDone && "border-emerald-500 bg-emerald-500 text-white",
                      !isActive && !isDone && "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn("text-xs font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1 mx-2 mb-4", isDone ? "bg-emerald-500" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hi {user?.fullName?.split(" ")[0] || "there"}! Let's start with your basic details.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={set("phone")}
                      type="tel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Occupation</Label>
                    <Select value={form.occupation} onValueChange={setSelect("occupation")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select occupation type" />
                      </SelectTrigger>
                      <SelectContent>
                        {OCCUPATIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Income & Employment</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tell us about your income so we can give better advice.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Employer / Company Name</Label>
                    <Input
                      placeholder="e.g. Tata Consultancy Services"
                      value={form.employerName}
                      onChange={set("employerName")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Monthly Income (₹)</Label>
                      <Input
                        placeholder="e.g. 75000"
                        type="number"
                        value={form.monthlyIncome}
                        onChange={set("monthlyIncome")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Est. Monthly Expenses (₹)</Label>
                      <Input
                        placeholder="e.g. 30000"
                        type="number"
                        value={form.estimatedMonthlyExpenses}
                        onChange={set("estimatedMonthlyExpenses")}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Monthly Rent (₹)</Label>
                      <Input
                        placeholder="0"
                        type="number"
                        value={form.monthlyRent}
                        onChange={set("monthlyRent")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>EMI Amount (₹)</Label>
                      <Input
                        placeholder="0"
                        type="number"
                        value={form.emiAmount}
                        onChange={set("emiAmount")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Insurance (₹/mo)</Label>
                      <Input
                        placeholder="0"
                        type="number"
                        value={form.insurancePremium}
                        onChange={set("insurancePremium")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Bank Account Details</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your bank details are stored securely and used only for reference.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Bank Name</Label>
                      <Input
                        placeholder="e.g. HDFC Bank"
                        value={form.bankName}
                        onChange={set("bankName")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Account Type</Label>
                      <Select value={form.accountType} onValueChange={setSelect("accountType")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCOUNT_TYPES.map((a) => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account Number</Label>
                    <Input
                      placeholder="e.g. 0123456789012"
                      value={form.accountNumber}
                      onChange={set("accountNumber")}
                      type="text"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>IFSC Code</Label>
                      <Input
                        placeholder="e.g. HDFC0001234"
                        value={form.ifscCode}
                        onChange={set("ifscCode")}
                        className="uppercase"
                        onInput={(e) => {
                          const t = e.target as HTMLInputElement;
                          t.value = t.value.toUpperCase();
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Branch Name</Label>
                      <Input
                        placeholder="e.g. Andheri West"
                        value={form.branchName}
                        onChange={set("branchName")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Your Financial Goal</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    What's your primary financial goal? We'll tailor advice around it.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {FINANCIAL_GOALS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setSelect("financialGoal")(g.value)}
                      className={cn(
                        "p-3 text-left text-sm border rounded-lg transition-all",
                        form.financialGoal === g.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border/50 hover:border-primary/40 hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  You can change this anytime from your profile settings.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
              {step > 1 ? (
                <Button variant="outline" onClick={back} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="text-muted-foreground"
                >
                  Skip for now
                </Button>
              )}

              {step < STEPS.length ? (
                <Button onClick={next} className="gap-2">
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={isLoading} className="gap-2 px-8">
                  {isLoading ? "Saving..." : "Complete Setup"}
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Step {step} of {STEPS.length} — All fields are optional. You can complete this later.
        </p>
      </div>
    </div>
  );
}
