import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, PiggyBank, MessageSquare, LineChart, Wallet } from "lucide-react";
import { cn } from "@/lib/format";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Budgets", href: "/budgets", icon: PiggyBank },
    { name: "AI Advisor", href: "/chat", icon: MessageSquare },
    { name: "Analytics", href: "/analytics", icon: LineChart },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-sidebar-primary font-display font-semibold text-lg">
            <Wallet className="w-6 h-6" />
            <span>ClearFin</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
