import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatPct, formatUsd } from "@/lib/format";

export default function BalanceBlock({ total, changeValue, changePct, loading }) {
  const positive = changeValue >= 0;
  const Trend = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="relative mt-8">
      <div
        aria-hidden="true"
        className="glow-mint pointer-events-none absolute -inset-x-10 -top-14 h-44 opacity-80"
      />
      <div className="relative text-center">
        <p className="eyebrow">Total balance</p>

        {loading ? (
          <div className="mx-auto mt-4 h-11 w-48 animate-pulse rounded-2xl bg-secondary/70" />
        ) : (
          <p className="mt-3 font-heading text-[42px] font-semibold leading-none tracking-[-0.02em] tabular">
            {formatUsd(total)}
          </p>
        )}

        <div className="mt-3.5 flex items-center justify-center">
          {loading ? (
            <div className="h-6 w-32 animate-pulse rounded-full bg-secondary/60" />
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium tabular ${
                positive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              }`}
            >
              <Trend className="h-3.5 w-3.5" strokeWidth={2.2} />
              {formatUsd(Math.abs(changeValue))}
              <span className="opacity-60">·</span>
              {formatPct(changePct)}
              <span className="opacity-50">24h</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}