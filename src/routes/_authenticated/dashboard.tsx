import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { Wallet, TrendingUp, Receipt, Award } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ExpenseWise" }] }),
  component: DashboardPage,
});

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

function DashboardPage() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, title, amount, expense_date, category_id, categories(name)")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const thisMonth = expenses
    .filter((e) => new Date(e.expense_date) >= monthStart)
    .reduce((s, e) => s + Number(e.amount), 0);
  const highest = expenses.reduce((m, e) => Math.max(m, Number(e.amount)), 0);

  const byCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      const name = (e.categories as { name?: string } | null)?.name ?? "Uncategorized";
      acc[name] = (acc[name] ?? 0) + Number(e.amount);
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const months: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const sum = expenses
      .filter((e) => {
        const dt = new Date(e.expense_date);
        return dt >= d && dt < next;
      })
      .reduce((s, e) => s + Number(e.amount), 0);
    months.push({ label: d.toLocaleString("en-US", { month: "short" }), total: sum });
  }

  const recent = expenses.slice(0, 5);

  const stats = [
    { label: "Total Spending", value: formatCurrency(total), icon: Wallet, tone: "bg-primary/10 text-primary" },
    { label: "This Month", value: formatCurrency(thisMonth), icon: TrendingUp, tone: "bg-blue-500/10 text-blue-600" },
    { label: "Total Expenses", value: expenses.length.toString(), icon: Receipt, tone: "bg-amber-500/10 text-amber-600" },
    { label: "Highest Expense", value: formatCurrency(highest), icon: Award, tone: "bg-purple-500/10 text-purple-600" },
  ];

  return (
    <AppShell title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
        </h2>
        <p className="text-muted-foreground">Here's a snapshot of your spending.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-2 text-2xl font-bold">{s.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly Spending</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" fill="oklch(0.55 0.16 160)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent Expenses</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No expenses yet. Add one from the Expenses page.</p>
          ) : (
            <div className="divide-y">
              {recent.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(e.categories as { name?: string } | null)?.name ?? "Uncategorized"} · {formatDate(e.expense_date)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(e.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}