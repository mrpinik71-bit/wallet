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
  const empty = item.value === 0;

  return (
    <Link
      to="/receive"
      search={{ coin: item.id }}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/30"
    >
      <CoinAvatar symbol={item.symbol} color={item.color} logo={item.logo} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium leading-tight">{item.name}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-tight text-muted-foreground">
          <span className="truncate tabular">{compactAmount(item.balance)}</span>
          <span className="rounded bg-secondary/80 px-1 py-px text-[9px] font-semibold uppercase tracking-wide">
            {item.symbol}
          </span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-[13.5px] font-semibold leading-tight tabular ${empty ? "text-muted-foreground" : ""}`}>
          {formatUsd(item.value)}
        </p>
        <p
          className={`mt-1 inline-flex items-center rounded px-1 py-px text-[10.5px] font-medium leading-tight tabular ${
            empty ? "text-muted-foreground" : up ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          }`}
        >
          {empty ? "—" : formatPct(item.change24h)}
        </p>
      </div>
    </Link>
  );
}