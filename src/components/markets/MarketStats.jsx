import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatPct, formatUsd } from "@/lib/format";

function Tile({ label, value, hint, tone }) {
  return (
    <div className="rounded-2xl border border-foreground/[0.07] bg-foreground/[0.022] p-3.5">
      <p className="text-[8.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">{label}</p>
      <p className="mt-2 font-heading text-[15px] font-semibold tracking-tight num">{value}</p>
      {hint ? (
        <p className={`mt-1 inline-flex items-center gap-1 text-[10.5px] font-medium num ${tone === "down" ? "text-destructive" : tone === "up" ? "text-primary" : "text-muted-foreground/70"}`}>
          {tone === "up" ? <ArrowUpRight className="h-3 w-3" /> : null}
          {tone === "down" ? <ArrowDownRight className="h-3 w-3" /> : null}
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function MarketStats({ globals, loading }) {
  const change = globals?.marketCapChange ?? 0;
  const greed = globals?.fearGreed;

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
      <Tile
        label="Total market cap"
        value={globals ? formatUsd(globals.marketCap, { compact: true }) : loading ? "…" : "—"}
        hint={globals ? formatPct(change) : null}
        tone={change >= 0 ? "up" : "down"}
      />
      <Tile
        label="24h volume"
        value={globals ? formatUsd(globals.volume, { compact: true }) : loading ? "…" : "—"}
      />
      <Tile
        label="BTC dominance"
        value={globals ? `${globals.btcDominance.toFixed(1)}%` : loading ? "…" : "—"}
      />
      <Tile
        label="Fear & greed"
        value={greed ? `${greed.value} · ${greed.label}` : loading ? "…" : "—"}
        hint={greed ? (greed.value >= 50 ? "Risk appetite rising" : "Risk appetite cooling") : null}
        tone={greed ? (greed.value >= 50 ? "up" : "down") : "flat"}
      />
    </div>
  );
}