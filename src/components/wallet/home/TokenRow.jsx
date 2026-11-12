import { Link } from "@tanstack/react-router";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { formatPct, formatUsd } from "@/lib/format";

function compactAmount(value) {
  if (!value) return "0";
  if (value < 0.0001) return value.toPrecision(4).replace(/0+$/, "");
  if (value < 1) return value.toFixed(6).replace(/0+$/, "");
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value < 1000 ? 4 : 2 }).format(value);
}

export default function TokenRow({ item }) {
  const up = item.change24h >= 0;

  return (
    <Link
      to="/receive"
      search={{ coin: item.id }}
      className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-secondary/40"
    >
      <CoinAvatar symbol={item.symbol} color={item.color} logo={item.logo} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium leading-tight">{item.name}</p>
        <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground tabular">
          {compactAmount(item.balance)} {item.symbol}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[13px] font-medium leading-tight tabular">{formatUsd(item.value)}</p>
        <p
          className={`mt-0.5 text-[11px] leading-tight tabular ${
            item.value === 0 ? "text-muted-foreground" : up ? "text-primary" : "text-destructive"
          }`}
        >
          {item.value === 0 ? "—" : formatPct(item.change24h)}
        </p>
      </div>
    </Link>
  );
}