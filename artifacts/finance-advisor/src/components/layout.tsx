import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, PiggyBank, MessageSquare, LineChart, Wallet, LogOut, User, ChevronUp } from "lucide-react";
import { cn } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Budgets", href: "/budgets", icon: PiggyBank },
    { name: "AI Advisor", href: "/chat", icon: MessageSquare },
    { name: "Analytics", href: "/analytics", icon: LineChart },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/landing");
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar hidden md:flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-sidebar-primary font-display font-semibold text-lg">
            <Wallet className="w-6 h-6" />
            <span>ClearFin</span>
          </div>
        </div>

        {/* Nav links */}
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

        {/* User footer */}
        <div className="p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-sidebar-accent/50 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-sidebar-foreground truncate text-xs">{user?.fullName}</p>
                  <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
                </div>
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/onboarding")} className="gap-2 cursor-pointer">
                <User className="w-4 h-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
