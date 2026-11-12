import { formatPct, formatUsd } from "@/lib/format";

export default function BalanceBlock({ total, changeValue, changePct, loading }) {
  const positive = changeValue >= 0;

  return (
    <div className="mt-7 px-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Total balance</p>
      {loading ? (
        <div className="mt-3 h-10 w-40 animate-pulse rounded-xl bg-secondary/70" />
      ) : (
        <p className="mt-2 font-heading text-[40px] font-semibold leading-none tracking-tight tabular">
          {formatUsd(total)}
        </p>
      )}
      <p
        className={`mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium tabular ${
          positive ? "text-primary" : "text-destructive"
        }`}
      >
        <span className="text-[10px]">{positive ? "▲" : "▼"}</span>
        {formatUsd(Math.abs(changeValue))} ({formatPct(Math.abs(changePct))})
      </p>
    </div>
  );
}