import { useState } from "react";
import {
  useListBudgets,
  useCreateBudget,
  useDeleteBudget,
  useGetBudgetStatus,
  useListCategories,
  getListBudgetsQueryKey,
  getGetBudgetStatusQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  limit: z.coerce.number().positive("Limit must be positive"),
  period: z.enum(["monthly", "weekly"]),
});

type BudgetForm = z.infer<typeof budgetSchema>;

export default function Budgets() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories();
  const { data: budgetStatus, isLoading } = useGetBudgetStatus();
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();

  const form = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { category: "", limit: 0, period: "monthly" },
  });

  const onSubmit = (data: BudgetForm) => {
    createBudget.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBudgetStatusQueryKey() });
          setOpen(false);
          form.reset();
          toast({ title: "Budget created successfully" });
        },
        onError: () => {
          toast({ title: "Failed to create budget", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteBudget.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBudgetStatusQueryKey() });
          toast({ title: "Budget deleted" });
        },
      }
    );
  };

  const statusIcon = (status: string) => {
    if (status === "exceeded") return <XCircle className="w-4 h-4 text-destructive" />;
    if (status === "warning") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  };

  const statusColor = (status: string) => {
    if (status === "exceeded") return "bg-destructive";
    if (status === "warning") return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1">Set spending limits and track them in real time</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-budget" className="gap-2">
              <Plus className="w-4 h-4" />
              New Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Budget</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-budget-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limit (₹)</FormLabel>
                        <FormControl>
                          <Input data-testid="input-budget-limit" type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-budget-period">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button data-testid="button-submit-budget" type="submit" disabled={createBudget.isPending}>
                    {createBudget.isPending ? "Creating..." : "Create Budget"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : budgetStatus?.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground text-sm">No budgets yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first budget to start tracking spending.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetStatus?.map((b) => (
            <Card key={b.id} data-testid={`card-budget-${b.id}`} className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcon(b.status)}
                    <CardTitle className="text-base font-medium">{b.category}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs capitalize",
                        b.status === "exceeded" && "bg-destructive/10 text-destructive",
                        b.status === "warning" && "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {b.status}
                    </Badge>
                    <Button
                      data-testid={`button-delete-budget-${b.id}`}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(b.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="capitalize">{b.period} budget</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress
                  value={b.percentage}
                  className="h-2"
                />
                <div className="flex items-center justify-between text-sm">
                  <span data-testid={`text-spent-${b.id}`} className="text-muted-foreground">
                    Spent: <span className="font-medium text-foreground">{formatCurrency(b.spent)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    of <span className="font-medium text-foreground">{formatCurrency(b.limit)}</span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {b.status === "exceeded"
                    ? `Overspent by ${formatCurrency(b.spent - b.limit)}`
                    : `${formatCurrency(b.remaining)} remaining`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
