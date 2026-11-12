import { PieChart } from "lucide-react";

export default function AllocationCard({ holdings, loading }) {
  const active = holdings.filter((item) => item.value > 0);
  const total = active.reduce((sum, item) => sum + item.value, 0);
  const top = active.slice(0, 4);
  const chains = new Set(active.map((item) => item.chain)).size;

  return (
    <section className="lux noise relative overflow-hidden p-4">
      <div className="relative">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[12px] font-semibold tracking-tight">Allocation</h2>
          <PieChart className="h-3.5 w-3.5 text-muted-foreground/50" strokeWidth={1.7} />
        </div>

        {loading && holdings.length === 0 ? (
          <div className="mt-4 space-y-3">
            <div className="h-2 w-full animate-pulse rounded-full bg-foreground/[0.06]" />
            <div className="h-2.5 w-28 animate-pulse rounded-full bg-foreground/[0.05]" />
            <div className="h-2.5 w-20 animate-pulse rounded-full bg-foreground/[0.04]" />
          </div>
        ) : total === 0 ? (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
            Your allocation appears here once this wallet holds a balance.
          </p>
        ) : (
          <>
            <div className="mt-3.5 flex h-2 w-full gap-[3px] overflow-hidden rounded-full">
              {top.map((item) => (
                <span
                  key={item.id}
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.value / total) * 100}%`,
                    backgroundColor: item.color || "hsl(var(--primary))",
                  }}
                  title={`${item.symbol} ${((item.value / total) * 100).toFixed(1)}%`}
                />
              ))}
            </div>

            <ul className="mt-3.5 space-y-2">
              {top.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color || "hsl(var(--primary))" }}
                  />
                  <span className="flex-1 truncate text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground/80">
                    {item.symbol}
                  </span>
                  <span className="text-[10.5px] font-medium num">
                    {((item.value / total) * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-3.5 border-t border-foreground/[0.06] pt-3 text-[8.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground/55">
              {active.length} {active.length === 1 ? "asset" : "assets"} · {chains} {chains === 1 ? "chain" : "chains"}
            </p>
          </>
        )}
      </div>
    </section>
  );
}