import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import useMarkets from "@/hooks/useMarkets";
import { formatPct, formatPrice } from "@/lib/format";

export default function MarketPulse() {
  const { coins, loading } = useMarkets();

  const movers = [...coins]
    .filter((coin) => coin.spark.length > 0)
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 3);

  return (
    <section className="mt-3 rounded-2xl border border-foreground/[0.07] bg-foreground/[0.022] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[8.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">Market pulse</p>
        <Link
          to="/markets"
          className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          All markets <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading && movers.length === 0 ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-8 animate-pulse rounded-lg bg-foreground/[0.04]" />
          ))}
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-foreground/[0.05]">
          {movers.map((coin) => {
            const up = coin.change24h >= 0;
            return (
              <li key={coin.id} className="flex items-center gap-2.5 py-2">
                <CoinAvatar symbol={coin.symbol} color={coin.color} logo={coin.logo} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-medium leading-tight">{coin.symbol}</p>
                  <p className="mt-0.5 truncate text-[9.5px] text-muted-foreground/60 num">{formatPrice(coin.price)}</p>
                </div>
                <p className={`text-[11px] font-medium num ${up ? "text-primary" : "text-destructive"}`}>
                  {formatPct(coin.change24h)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}