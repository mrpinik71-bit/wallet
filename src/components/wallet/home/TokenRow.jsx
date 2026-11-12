import { Link } from "@tanstack/react-router";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { formatUsd } from "@/lib/format";

function compactAmount(value) {
  if (!value) return "0";
  if (value < 0.0001) return value.toPrecision(4).replace(/0+$/, "");
  if (value < 1) return value.toFixed(6).replace(/0+$/, "");
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value < 1000 ? 4 : 2 }).format(value);
}

export default function TokenRow({ item }) {
  const positive = item.changeValue >= 0;

  return (
    <Link
      to="/receive"
      search={{ coin: item.id }}
      className="flex items-center gap-3 py-3 transition-colors hover:bg-secondary/20"
    >
      <CoinAvatar symbol={item.symbol} color={item.color} logo={item.logo} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{item.name}</p>
        <p className="truncate text-[11px] text-muted-foreground tabular">
          {compactAmount(item.balance)} {item.symbol}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[13px] font-medium tabular">{formatUsd(item.value)}</p>
        <p className={`text-[11px] tabular ${positive ? "text-primary" : "text-destructive"}`}>
          {positive ? "+" : "−"}
          {formatUsd(Math.abs(item.changeValue)).replace("$", "$")}
        </p>
      </div>
    </Link>
  );
}