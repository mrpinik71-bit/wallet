import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { formatPct, formatUsd } from "@/lib/format";

export default function BalanceBlock({ total, changeValue, changePct, loading }) {
  const positive = changeValue >= 0;
  const Trend = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <section className="relative mt-6 overflow-hidden rounded-[26px] border border-border/70 bg-gradient-to-b from-card to-background p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-primary/20 blur-[64px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Total balance</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <TrendingUp className="h-2.5 w-2.5 text-primary" strokeWidth={2.4} />
            Live
          </span>
        </div>

        {loading ? (
          <div className="mt-3.5 h-12 w-52 animate-pulse rounded-xl bg-secondary/70" />
        ) : (
          <p className="mt-3 font-heading text-[44px] font-semibold leading-none tracking-[-0.035em] tabular">
            {formatUsd(total)}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-3.5">
          {loading ? (
            <div className="h-6 w-36 animate-pulse rounded-full bg-secondary/60" />
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium tabular ${
                positive ? "bg-primary/12 text-primary" : "bg-destructive/12 text-destructive"
              }`}
            >
              <Trend className="h-3.5 w-3.5" strokeWidth={2.2} />
              {positive ? "+" : "−"}
              {formatUsd(Math.abs(changeValue))}
              <span className="opacity-50">·</span>
              {formatPct(changePct)}
            </span>
          )}
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
            Past 24h
          </span>
        </div>
      </div>
    </section>
  );
}