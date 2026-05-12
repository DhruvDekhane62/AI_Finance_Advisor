import React from "react";
import { useGetFinancialSummary, useListTransactions, useGetMonthlyTrend } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetFinancialSummary();
  const { data: transactions, isLoading: isLoadingTransactions } = useListTransactions({ limit: 5 });
  const { data: trend, isLoading: isLoadingTrend } = useGetMonthlyTrend();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your money today.</p>
        </div>
        <Link href="/chat" className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-full text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          Ask AI Advisor
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title="Total Balance" 
          amount={summary ? summary.totalIncome - summary.totalExpenses : 0} 
          icon={Wallet} 
          trend="+2.5%" 
          isLoading={isLoadingSummary} 
        />
        <SummaryCard 
          title="Income this Month" 
          amount={summary?.thisMonthIncome || 0} 
          icon={ArrowUpRight} 
          iconColor="text-emerald-500"
          isLoading={isLoadingSummary} 
        />
        <SummaryCard 
          title="Expenses this Month" 
          amount={summary?.thisMonthExpenses || 0} 
          icon={ArrowDownRight} 
          iconColor="text-rose-500"
          isLoading={isLoadingSummary} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>Your income vs expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTrend ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickFormatter={(val) => `$${val}`} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} name="Income" />
                    <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest activity</CardDescription>
            </div>
            <Link href="/transactions" className="text-sm text-primary font-medium hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="space-y-4 mt-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-full h-12" />)}
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {transactions?.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No recent transactions</p>
                ) : (
                  transactions?.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600')}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.category} &bull; {formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <span className={cn("text-sm font-medium", tx.type === 'income' ? 'text-emerald-600' : 'text-foreground')}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ title, amount, icon: Icon, trend, iconColor, isLoading }: { title: string, amount: number, icon: any, trend?: string, iconColor?: string, isLoading?: boolean }) {
  return (
    <Card className="shadow-sm border-border/50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("p-2 bg-muted rounded-md", iconColor || "text-foreground")}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <h2 className="text-3xl font-display font-semibold">{formatCurrency(amount)}</h2>
          )}
          {trend && !isLoading && <span className="text-sm text-emerald-600 font-medium">{trend}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
