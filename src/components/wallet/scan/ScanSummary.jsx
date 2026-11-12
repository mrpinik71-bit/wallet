import { formatUsd } from "@/lib/format";

export default function ScanSummary({ results, progress, fundedCount, fundedTotal, onlyFunded, onToggleFilter, finished }) {
  return (
    <section className="flex items-center justify-between rounded-[18px] border border-foreground/[0.07] bg-foreground/[0.025] px-4 py-3">
      <div>
        <p className="text-[8.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
          {finished ? "Funded wallets" : "Scanning"}
        </p>
        <p className="mt-1 font-heading text-[15px] font-semibold num">
          {fundedCount} <span className="text-muted-foreground/60">/ {results.length}</span>
        </p>
        {fundedCount > 0 ? (
          <p className="mt-0.5 text-[10.5px] text-primary num">{formatUsd(fundedTotal)} found</p>
        ) : (
          <p className="mt-0.5 text-[10.5px] text-muted-foreground/60">No balance found yet</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="text-[10px] font-medium text-muted-foreground/70 num">
          {progress.completed}/{progress.total}
        </p>
        <button
          type="button"
          onClick={onToggleFilter}
          className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] transition-colors ${
            onlyFunded
              ? "border-primary/45 bg-primary/10 text-primary"
              : "border-foreground/[0.1] text-muted-foreground/70"
          }`}
        >
          Funded only
        </button>
      </div>
    </section>
  );
}