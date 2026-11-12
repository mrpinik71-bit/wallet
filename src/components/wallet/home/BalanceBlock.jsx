import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatPct, formatUsd } from "@/lib/format";

export default function BalanceBlock({ total, changeValue, changePct, loading, assets, chains }) {
  const positive = changeValue >= 0;
  const Trend = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <section className="lux noise relative mt-5 overflow-hidden p-5">
      <div
        aria-hidden="true"
        className="glow-mint pointer-events-none absolute -right-16 -top-24 h-56 w-60 opacity-90"
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-medium uppercase tracking-[0.32em] text-muted-foreground/70">
            Total balance
          </p>
          <span className="rounded-full border border-foreground/[0.08] px-2 py-[3px] text-[8.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
            USD
          </span>
        </div>

        {loading ? (
          <div className="mt-4 h-[42px] w-52 animate-pulse rounded-lg bg-foreground/[0.06]" />
        ) : (
          <p className="mt-3.5 font-heading text-[43px] font-semibold leading-none num">{formatUsd(total)}</p>
        )}

        <div className="mt-4 flex items-center gap-2">
          {loading ? (
            <div className="h-5 w-32 animate-pulse rounded-full bg-foreground/[0.06]" />
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[11px] font-medium num ${
                positive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              }`}
            >
              <Trend className="h-3 w-3" strokeWidth={2.4} />
              {positive ? "+" : "−"}
              {formatUsd(Math.abs(changeValue))}
              <span className="opacity-45">·</span>
              {formatPct(changePct)}
            </span>
          )}
          <span className="text-[8.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground/50">
            Past 24h
          </span>
        </div>

        <div className="hairline my-4" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[8.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/55">
              Assets held
            </p>
            <p className="mt-1 font-heading text-[15px] font-semibold num">{loading ? "—" : assets}</p>
          </div>
          <div>
            <p className="text-[8.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/55">
              Chains live
            </p>
            <p className="mt-1 font-heading text-[15px] font-semibold num">{loading ? "—" : chains}</p>
          </div>
        </div>
      </div>
    </section>
  );
}