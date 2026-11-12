import { PieChart } from "lucide-react";

export default function AllocationCard({ holdings, loading }) {
  const active = holdings.filter((item) => item.value > 0);
  const total = active.reduce((sum, item) => sum + item.value, 0);
  const top = active.slice(0, 4);
  const chains = new Set(active.map((item) => item.chain)).size;

  return (
    <section className="rounded-[22px] border border-border/70 bg-card/50 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[13px] font-semibold tracking-tight">Allocation</h2>
        <PieChart className="h-3.5 w-3.5 text-muted-foreground/70" strokeWidth={1.8} />
      </div>

      {loading && holdings.length === 0 ? (
        <div className="mt-4 space-y-3">
          <div className="h-2 w-full animate-pulse rounded-full bg-secondary/70" />
          <div className="h-2.5 w-28 animate-pulse rounded-full bg-secondary/60" />
          <div className="h-2.5 w-20 animate-pulse rounded-full bg-secondary/50" />
        </div>
      ) : total === 0 ? (
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
          Your allocation appears here once this wallet holds a balance.
        </p>
      ) : (
        <>
          <div className="mt-3.5 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-secondary/60">
            {top.map((item) => (
              <span
                key={item.id}
                className="h-full rounded-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color || "hsl(var(--primary))" }}
                title={`${item.symbol} ${((item.value / total) * 100).toFixed(1)}%`}
              />
            ))}
          </div>

          <ul className="mt-3.5 space-y-2">
            {top.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color || "hsl(var(--primary))" }}
                />
                <span className="flex-1 truncate text-[11.5px] font-medium text-muted-foreground">{item.symbol}</span>
                <span className="text-[11.5px] font-medium tabular">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3.5 border-t border-border/50 pt-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            {active.length} {active.length === 1 ? "asset" : "assets"} · {chains} {chains === 1 ? "chain" : "chains"}
          </p>
        </>
      )}
    </section>
  );
}