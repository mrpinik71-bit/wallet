import CoinAvatar from "@/components/wallet/CoinAvatar";
import { chains } from "@/lib/chains/config";

export default function NetworkAssets({ groups, selectedId, onSelect }) {
  if (groups.length === 0) {
    return <p className="py-8 text-center text-[11px] text-muted-foreground">No asset on that network.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.chain}>
          <p className="px-0.5 text-[8.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/50">
            {chains[group.chain]?.name || group.chain}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {group.items.map((item) => {
              const active = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                    active
                      ? "border-primary/40 bg-primary/10"
                      : "border-foreground/[0.07] bg-foreground/[0.022] hover:border-foreground/[0.14]"
                  }`}
                >
                  <CoinAvatar symbol={item.symbol} color={item.color} logo={item.logo} size="sm" />
                  <div className="min-w-0">
                    <p className={`truncate text-[11px] font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                      {item.symbol}
                    </p>
                    <p className="truncate text-[9px] text-muted-foreground/70">{item.kind === "native" ? "Native" : "Token"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}