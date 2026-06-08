import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Wallet, PieChart, Search, Shield, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ExpenseWise — Personal Expense Tracker" },
      { name: "description", content: "Track daily expenses, manage categories, and analyze your spending with beautiful charts." },
      { property: "og:title", content: "ExpenseWise — Personal Expense Tracker" },
      { property: "og:description", content: "Track daily expenses, manage categories, and analyze your spending with beautiful charts." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">ExpenseWise</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Log in</Link></Button>
            <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
          </div>
        </div>
      </header>

      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Take control of your every expense.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">
              ExpenseWise helps you log daily expenses, organize them by category, and visualize
              your spending habits — all in one secure place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-lg">
                <Link to="/auth" search={{ mode: "signup" }}>Create free account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
                <Link to="/auth">I already have one</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Everything you need to budget smarter</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Designed to be simple, secure, and fast — so you actually keep using it.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Receipt, title: "Quick Expense Entry", body: "Log an expense in seconds with title, amount, category, and date." },
            { icon: PieChart, title: "Visual Analytics", body: "See where your money goes with category and monthly charts." },
            { icon: Search, title: "Search & Filter", body: "Find any expense by title, category, month or date range." },
            { icon: Shield, title: "Private & Secure", body: "Your data is protected with bank-grade authentication." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/40">
        <div className="container mx-auto px-4 py-16 grid gap-8 md:grid-cols-3 text-center">
          {[
            { stat: "8+", label: "Default categories ready to go" },
            { stat: "100%", label: "Of your data stays yours" },
            { stat: "<1m", label: "To log a new expense" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold text-primary">{s.stat}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 text-center">
        <TrendingUp className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-3xl md:text-4xl font-bold">Start tracking in under a minute</h2>
        <p className="mt-3 text-muted-foreground">No credit card. No clutter. Just clarity.</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/auth" search={{ mode: "signup" }}>Create your free account</Link>
        </Button>
      </section>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} ExpenseWise ·&nbsp;
        </div>
      </footer>
    </div>
  );
}

// imported below to keep the component list tidy
import { Receipt } from "lucide-react";
