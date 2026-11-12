import { Link } from "@tanstack/react-router";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { chains } from "@/lib/chains/config";
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
  const network = chains[item.chain]?.name;

  const body = (
    <>
      <CoinAvatar symbol={item.symbol} color={item.color} logo={item.logo} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-[13px] font-medium leading-tight">{item.name}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[10.5px] leading-tight text-muted-foreground/80">
          <span className="truncate num">{compactAmount(item.balance)}</span>
          <span className="rounded border border-foreground/[0.08] px-1 py-px text-[8.5px] font-semibold uppercase tracking-[0.08em]">
            {item.symbol}
          </span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-[13px] font-semibold leading-tight num ${empty ? "text-muted-foreground/70" : ""}`}>
          {item.discovered ? "—" : formatUsd(item.value)}
        </p>
        <p
          className={`mt-1 inline-flex rounded px-1 py-px text-[10px] font-medium leading-tight num ${
            empty ? "text-muted-foreground/60" : up ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          }`}
        >
          {item.discovered ? network || "on-chain" : empty ? "—" : formatPct(item.change24h)}
        </p>
      </div>
    </>
  );

  const className = "flex w-full items-center gap-3 px-4 py-3.5";

  // A token found on-chain has no receive page of its own, so the row is a label.
  if (item.discovered) return <div className={className}>{body}</div>;

  return (
    <Link to="/receive" search={{ coin: item.id }} className={`${className} transition-colors hover:bg-foreground/[0.03]`}>
      {body}
    </Link>
  );
}