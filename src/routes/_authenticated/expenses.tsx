import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

type Category = { id: string; name: string };
type Expense = {
  id: string; title: string; amount: number | string; expense_date: string;
  description: string; category_id: string | null;
  categories?: { name: string } | null;
};

const expenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0").max(99999999),
  category_id: z.string().uuid("Pick a category").or(z.literal("")),
  expense_date: z.string().min(1, "Date is required"),
  description: z.string().max(500).default(""),
});

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({ meta: [{ title: "Expenses — ExpenseWise" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState<"date_desc" | "date_asc" | "amt_desc" | "amt_asc">("date_desc");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [open, setOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, title, amount, expense_date, description, category_id, categories(name)")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Expense[];
    },
  });

  const filtered = useMemo(() => {
    let list = [...expenses];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }
    if (catFilter !== "all") list = list.filter((e) => e.category_id === catFilter);
    if (monthFilter !== "all") {
      list = list.filter((e) => e.expense_date.slice(0, 7) === monthFilter);
    }
    if (fromDate) list = list.filter((e) => e.expense_date >= fromDate);
    if (toDate) list = list.filter((e) => e.expense_date <= toDate);
    list.sort((a, b) => {
      switch (sort) {
        case "date_asc": return a.expense_date.localeCompare(b.expense_date);
        case "amt_desc": return Number(b.amount) - Number(a.amount);
        case "amt_asc": return Number(a.amount) - Number(b.amount);
        default: return b.expense_date.localeCompare(a.expense_date);
      }
    });
    return list;
  }, [expenses, search, catFilter, monthFilter, fromDate, toDate, sort]);

  const monthOptions = useMemo(() => {
    const set = new Set(expenses.map((e) => e.expense_date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = expenseSchema.safeParse({
      title: fd.get("title"),
      amount: fd.get("amount"),
      category_id: fd.get("category_id") ?? "",
      expense_date: fd.get("expense_date"),
      description: fd.get("description") ?? "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not signed in"); return; }
    const payload = {
      title: parsed.data.title,
      amount: parsed.data.amount,
      category_id: parsed.data.category_id || null,
      expense_date: parsed.data.expense_date,
      description: parsed.data.description,
      user_id: user.id,
    };
    const op = editing
      ? supabase.from("expenses").update(payload).eq("id", editing.id)
      : supabase.from("expenses").insert(payload);
    const { error } = await op;
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Expense updated" : "Expense added");
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
    setOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Expense deleted");
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell title="Expenses">
      <Card className="mb-6">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing(null)}>
                  <Plus className="mr-2 h-4 w-4" /> Add expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit expense" : "Add expense"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" maxLength={120} required defaultValue={editing?.title ?? ""} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required defaultValue={editing?.amount ?? ""} />
                    </div>
                    <div>
                      <Label htmlFor="expense_date">Date</Label>
                      <Input id="expense_date" name="expense_date" type="date" required defaultValue={editing?.expense_date ?? today} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category_id">Category</Label>
                    <Select name="category_id" defaultValue={editing?.category_id ?? undefined}>
                      <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea id="description" name="description" maxLength={500} defaultValue={editing?.description ?? ""} />
                  </div>
                  <DialogFooter>
                    <Button type="submit">{editing ? "Save changes" : "Add expense"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {monthOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To" />
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Latest first</SelectItem>
                <SelectItem value="date_asc">Oldest first</SelectItem>
                <SelectItem value="amt_desc">Highest amount</SelectItem>
                <SelectItem value="amt_asc">Lowest amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-8 text-center text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No expenses found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{e.title}</div>
                        {e.description && <div className="text-xs text-muted-foreground line-clamp-1">{e.description}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                          {e.categories?.name ?? "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(e.expense_date)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon" variant="ghost"
                            onClick={() => { setEditing(e); setOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(e.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}