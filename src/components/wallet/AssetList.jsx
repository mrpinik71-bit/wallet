import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { assets } from "@/lib/sample-wallet";
import { formatAmount, formatPct, formatUsd } from "@/lib/format";

export default function AssetList() {
  const held = assets.map((a) => ({ ...a, value: a.price * a.amount }));
  const total = held.reduce((sum, a) => sum + a.value, 0);

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <h2 className="font-heading text-sm font-semibold tracking-tight">Your assets</h2>
        <Link
          to="/markets"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Explore markets <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <ul className="divide-y divide-border/60">
        {held.map((asset) => (
          <li key={asset.id}>
            <div className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-secondary/30">
              <CoinAvatar symbol={asset.symbol} color={asset.color} logo={asset.logo} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{asset.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {asset.symbol} · {asset.chain}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-medium tabular">{formatUsd(asset.value)}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground tabular">
                  {formatAmount(asset.amount, asset.symbol)}
                </p>
              </div>
              <div className="hidden w-20 text-right sm:block">
                <p
                  className={`text-[11px] font-medium tabular ${
                    asset.change24h >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {formatPct(asset.change24h)}
                </p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-foreground/40"
                    style={{ width: `${Math.max(6, Math.min(100, (asset.value / total) * 100 * 2.6))}%` }}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}