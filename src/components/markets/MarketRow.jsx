import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import Sparkline from "@/components/wallet/Sparkline";
import { formatPct, formatPrice, formatUsd } from "@/lib/format";
import { networkLabel } from "@/lib/markets";

export default function MarketRow({ coin }) {
  const up = coin.change24h >= 0;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.025] sm:grid-cols-[minmax(0,1fr)_78px_104px_112px]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="hidden w-5 shrink-0 text-right text-[10px] text-muted-foreground/40 num sm:block">
          {coin.rank ?? "—"}
        </span>
        <CoinAvatar symbol={coin.symbol} color={coin.color} logo={coin.logo} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium leading-tight">{coin.name}</p>
          <p className="mt-1 truncate text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
            {coin.symbol} · {networkLabel(coin.network)}
          </p>
        </div>
      </div>

      <div className="hidden sm:block">
        <Sparkline data={coin.spark} positive={coin.change7d >= 0} height={24} />
      </div>

      <div className="text-right">
        <p className="text-[12.5px] font-medium leading-tight num">{formatPrice(coin.price)}</p>
        <p
          className={`mt-1 inline-flex items-center justify-end gap-0.5 text-[10.5px] font-medium num ${
            up ? "text-primary" : "text-destructive"
          }`}
        >
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {formatPct(coin.change24h)}
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-[11.5px] text-muted-foreground num">{formatUsd(coin.marketCap, { compact: true })}</p>
        <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground/45 num">
          Vol {formatUsd(coin.volume, { compact: true })}
        </p>
      </div>
    </li>
  );
}