import { Link } from "wouter";
import { Wallet, TrendingUp, Shield, Bot, BarChart3, PiggyBank, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Visual breakdowns of your spending patterns across categories with monthly trends.",
  },
  {
    icon: Bot,
    title: "AI Financial Advisor",
    description: "Get personalized financial advice powered by AI that understands your data.",
  },
  {
    icon: PiggyBank,
    title: "Budget Tracking",
    description: "Set spending limits and get real-time alerts when you're close to exceeding them.",
  },
  {
    icon: TrendingUp,
    title: "Predictions",
    description: "AI-powered spending predictions help you plan and stay ahead of your finances.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your financial data is encrypted and stored securely. We never share your information.",
  },
  {
    icon: Wallet,
    title: "Complete Profile",
    description: "Link your bank details and income information for a comprehensive financial picture.",
  },
];

const benefits = [
  "Track income and expenses in Indian Rupees",
  "AI-powered chat advisor available 24/7",
  "Spending predictions with risk alerts",
  "Budget management with real-time status",
  "Monthly trend analysis and category breakdowns",
  "Secure profile with bank & income details",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold text-lg">
            <Wallet className="w-5 h-5" />
            <span>ClearFin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Bot className="w-3.5 h-3.5" />
          AI-Powered Personal Finance
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
          Take control of your{" "}
          <span className="text-primary">financial future</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          ClearFin combines smart expense tracking, budget management, and an AI advisor
          to give you a complete picture of your finances — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2 px-8">
              Start for free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-8">
              Sign in to your account
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {benefits.slice(0, 3).map((b) => (
            <div key={b} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              {b}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 border-t border-border/50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Everything you need to manage money smarter
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From tracking every rupee to predicting next month's spend — ClearFin has you covered.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                <div className="p-2.5 bg-primary/10 rounded-lg w-fit mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits list */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Built for India, priced for everyone
            </h2>
            <p className="text-muted-foreground mb-6">
              ClearFin is designed around Indian financial needs — from salary accounts to EMIs,
              insurance premiums, and Indian Rupee transactions.
            </p>
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-emerald-500/5 border border-primary/20 rounded-2xl p-8 text-center">
            <div className="text-4xl font-bold text-primary mb-2">₹0</div>
            <div className="text-sm text-muted-foreground mb-6">Free to get started</div>
            <Link href="/register">
              <Button className="w-full gap-2">
                Create your account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Wallet className="w-4 h-4 text-primary" />
            ClearFin
          </div>
          <p>© 2026 ClearFin. Your personal AI finance advisor.</p>
        </div>
      </footer>
    </div>
  );
}
