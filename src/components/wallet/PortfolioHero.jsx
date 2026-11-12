import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, Repeat, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { formatUsd } from "@/lib/format";
import { assets, portfolioHistory, totalBalance } from "@/lib/sample-wallet";

const actions = [
  { label: "Send", to: "/send", icon: ArrowUpRight },
  { label: "Receive", to: "/receive", icon: ArrowDownLeft },
  { label: "Swap", to: "/swap", icon: Repeat },
  { label: "Markets", to: "/markets", icon: TrendingUp },
];

export default function PortfolioHero() {
  const [hidden, setHidden] = useState(false);
  const total = totalBalance();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card">
      <div className="glow-mint pointer-events-none absolute inset-0" />
      <div className="relative grid gap-7 p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center lg:p-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">Total balance</span>
            <button
              type="button"
              onClick={() => setHidden((v) => !v)}
              aria-label={hidden ? "Show balance" : "Hide balance"}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <span className="font-display text-[44px] leading-[0.95] tracking-tight tabular sm:text-6xl">
              {hidden ? "••••••" : formatUsd(total)}
            </span>
            <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-1 text-xs font-medium text-primary">
              +2.48%
              <span className="text-muted-foreground">30d</span>
            </span>
          </div>

          <p className="mt-2.5 text-[13px] text-muted-foreground">
            {assets.length} assets across {new Set(assets.map((asset) => asset.chain)).size} networks
          </p>

          <div className="mt-6 grid max-w-md grid-cols-4 gap-2">
            {actions.map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-secondary/30 px-2 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/60"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-background text-foreground ring-1 ring-inset ring-border transition-colors group-hover:text-primary">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="relative h-[132px] w-full lg:h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolioHistory} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={1.8}
                fill="url(#pfFill)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}