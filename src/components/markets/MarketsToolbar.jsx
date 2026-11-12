import { RefreshCw, Search } from "lucide-react";

const tabs = [
  { id: "cap", label: "Market cap" },
  { id: "gainers", label: "Gainers" },
  { id: "losers", label: "Losers" },
  { id: "volume", label: "Volume" },
];

export default function MarketsToolbar({ query, onQuery, tab, onTab, network, onNetwork, networkOptions, onRefresh, refreshing }) {
  return (
    <div className="border-b border-foreground/[0.07] p-3.5">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search name, symbol or network"
            className="w-full rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] py-2 pl-9 pr-3 text-[12px] outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-primary/40"
          />
        </div>
        <select
          value={network}
          onChange={(event) => onNetwork(event.target.value)}
          aria-label="Filter by network"
          className="max-w-[122px] rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] px-2 py-2 text-[11px] text-muted-foreground outline-none"
        >
          <option value="all" className="bg-card">
            All networks
          </option>
          {networkOptions.map((item) => (
            <option key={item.id} value={item.id} className="bg-card">
              {item.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh prices"
          className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} strokeWidth={1.9} />
        </button>
      </div>

      <div className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-0.5">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTab(item.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[10.5px] font-medium transition-colors ${
              tab === item.id
                ? "bg-primary/12 text-primary ring-1 ring-inset ring-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}