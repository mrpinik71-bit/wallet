import CoinAvatar from "@/components/wallet/CoinAvatar";
import { chains } from "@/lib/chains/config";
import { formatCrypto, formatUsd } from "@/lib/format";

function Row({ item, onSelect }) {
  const funded = item.balance > 0;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-foreground/[0.03]"
      >
        <CoinAvatar symbol={item.symbol} color={item.color} logo={item.logo} />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[12.5px] font-medium ${funded ? "" : "text-muted-foreground"}`}>{item.name}</p>
          <p className="mt-0.5 truncate text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
            {chains[item.chain]?.name || item.chain}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-[12px] font-medium num ${funded ? "" : "text-muted-foreground/60"}`}>
            {formatCrypto(item.balance)} {item.symbol}
          </p>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground/70 num">{formatUsd(item.value)}</p>
        </div>
      </button>
    </li>
  );
}

export default function TokenPicker({ holdings, loading, onSelect }) {
  if (loading && holdings.length === 0) {
    return (
      <div className="mt-4 space-y-2">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="h-14 animate-pulse rounded-xl bg-foreground/[0.05]" />
        ))}
      </div>
    );
  }

  const funded = holdings.filter((item) => item.balance > 0);
  const empty = holdings.filter((item) => !(item.balance > 0));

  return (
    <div className="mt-4 space-y-4">
      <section className="overflow-hidden rounded-2xl border border-foreground/[0.07] bg-card/50">
        <p className="border-b border-foreground/[0.06] px-3.5 py-2 text-[8.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/55">
          With balance · {funded.length}
        </p>
        {funded.length > 0 ? (
          <ul className="divide-y divide-foreground/[0.05]">
            {funded.map((item) => (
              <Row key={item.id} item={item} onSelect={onSelect} />
            ))}
          </ul>
        ) : (
          <p className="px-3.5 py-6 text-center text-[11px] text-muted-foreground">No balances yet.</p>
        )}
      </section>

      {empty.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-foreground/[0.05] bg-card/30">
          <p className="border-b border-foreground/[0.05] px-3.5 py-2 text-[8.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/40">
            Other assets
          </p>
          <ul className="divide-y divide-foreground/[0.04]">
            {empty.map((item) => (
              <Row key={item.id} item={item} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}