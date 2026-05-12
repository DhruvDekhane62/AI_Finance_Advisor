import {
  useGetFinancialSummary,
  useGetSpendingByCategory,
  useGetMonthlyTrend,
  useGetSpendingPredictions,
  useGetBudgetStatus,
} from "@workspace/api-client-react";
import { formatCurrency, cn } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Lightbulb } from "lucide-react";

export default function Analytics() {
  const { data: summary, isLoading: isLoadingSummary } = useGetFinancialSummary();
  const { data: byCategory, isLoading: isLoadingCategory } = useGetSpendingByCategory();
  const { data: trend, isLoading: isLoadingTrend } = useGetMonthlyTrend();
  const { data: predictions, isLoading: isLoadingPredictions } = useGetSpendingPredictions();
  const { data: budgetStatus, isLoading: isLoadingBudget } = useGetBudgetStatus();

  const riskColor = predictions?.riskLevel === "high"
    ? "text-destructive"
    : predictions?.riskLevel === "medium"
    ? "text-amber-600"
    : "text-emerald-600";

  const riskBadge = predictions?.riskLevel === "high"
    ? "bg-destructive/10 text-destructive"
    : predictions?.riskLevel === "medium"
    ? "bg-amber-500/10 text-amber-600"
    : "bg-emerald-500/10 text-emerald-600";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep insights into your financial health</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Income", value: summary?.totalIncome, icon: TrendingUp, color: "text-emerald-600" },
          { label: "Total Expenses", value: summary?.totalExpenses, icon: TrendingDown, color: "text-rose-600" },
          { label: "Net Savings", value: summary?.netSavings, icon: TrendingUp, color: "text-primary" },
          { label: "Savings Rate", value: summary ? `${summary.savingsRate}%` : null, icon: TrendingUp, color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              {isLoadingSummary ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-xl font-semibold text-foreground">
                  {typeof value === "number" ? formatCurrency(value) : value ?? "--"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Monthly Trend</CardTitle>
            <CardDescription>Income vs expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTrend ? (
              <Skeleton className="w-full h-56" />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v)]}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="income" name="Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by category */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Spending by Category</CardTitle>
            <CardDescription>Breakdown of your expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCategory ? (
              <Skeleton className="w-full h-56" />
            ) : !byCategory || byCategory.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No expense data available
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="total"
                      nameKey="category"
                    >
                      {byCategory.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v)]}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Predictions + Budget Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Predictions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">AI Predictions</CardTitle>
                <CardDescription>Based on your spending patterns</CardDescription>
              </div>
              {predictions && (
                <Badge className={cn("capitalize text-xs", riskBadge)}>
                  {predictions.riskLevel} risk
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPredictions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Predicted this month</p>
                    <p className={cn("text-2xl font-semibold mt-0.5", riskColor)}>
                      {formatCurrency(predictions?.predictedMonthlyExpense ?? 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="text-lg font-medium text-foreground">{predictions?.confidenceLevel}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Alerts</p>
                  <div className="space-y-2">
                    {predictions?.alerts.map((alert, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{alert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recommendations</p>
                  <div className="space-y-2">
                    {predictions?.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <Lightbulb className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Budget Status</CardTitle>
            <CardDescription>Utilization across all active budgets</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBudget ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : !budgetStatus || budgetStatus.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No budgets created yet
              </div>
            ) : (
              <div className="space-y-4">
                {budgetStatus.map((b) => (
                  <div key={b.id} data-testid={`analytics-budget-${b.id}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {b.status === "exceeded" ? (
                          <XCircle className="w-3.5 h-3.5 text-destructive" />
                        ) : b.status === "warning" ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        <span className="text-sm font-medium text-foreground">{b.category}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                      </span>
                    </div>
                    <Progress value={b.percentage} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{b.percentage.toFixed(0)}% used</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
