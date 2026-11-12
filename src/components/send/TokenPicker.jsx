import CoinAvatar from "@/components/wallet/CoinAvatar";
import { chains } from "@/lib/chains/config";
import { formatCrypto, formatUsd } from "@/lib/format";

export default function TokenPicker({ holdings, loading, onSelect }) {
  if (loading && holdings.length === 0) {
    return (
      <div className="mt-4 space-y-2">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="h-14 animate-pulse rounded-xl bg-secondary/60" />
        ))}
      </div>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-border/40">
      {holdings.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-secondary/20"
          >
            <CoinAvatar symbol={item.symbol} color={item.color} logo={item.logo} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{item.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {chains[item.chain]?.name || item.chain}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-medium tabular">
                {formatCrypto(item.balance)} {item.symbol}
              </p>
              <p className="text-[11px] text-muted-foreground tabular">{formatUsd(item.value)}</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}