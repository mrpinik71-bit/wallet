import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Search, TrendingDown, TrendingUp } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import Sparkline from "@/components/wallet/Sparkline";
import { networks } from "@/lib/coin-catalog";
import { markets } from "@/lib/sample-wallet";
import { formatPct, formatUsd } from "@/lib/format";

export const Route = createFileRoute("/_authed/markets")({
  head: () => ({
    meta: [
      { title: "Markets — Helix" },
      { name: "description", content: "Live-style market analysis: prices, movers and seven day trends." },
    ],
  }),
  component: Markets,
});

const tabs = [
  { id: "all", label: "All assets" },
  { id: "gainers", label: "Gainers" },
  { id: "losers", label: "Losers" },
];

const stats = [
  { label: "Market cap", value: "$2.74T", change: 1.82 },
  { label: "24h volume", value: "$96.4B", change: -4.12 },
  { label: "BTC dominance", value: "57.3%", change: 0.34 },
  { label: "Fear & greed", value: "68 · Greed", change: 2.5 },
];

function Markets() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [network, setNetwork] = useState("all");

  const rows = useMemo(() => {
    const term = query.toLowerCase();
    const filtered = markets.filter(
      (coin) =>
        (network === "all" || coin.network === network) &&
        (coin.name.toLowerCase().includes(term) || coin.symbol.toLowerCase().includes(term)),
    );
    if (tab === "gainers") return [...filtered].sort((a, b) => b.change24h - a.change24h);
    if (tab === "losers") return [...filtered].sort((a, b) => a.change24h - b.change24h);
    return filtered;
  }, [query, tab, network]);

  return (
    <>
      <PageHeader
        eyebrow="Research"
        title="Markets"
        description="Track price action, momentum and volume across the assets in your wallet."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="panel p-4">
            <p className="eyebrow">{stat.label}</p>
            <p className="mt-2 font-heading text-lg font-semibold tracking-tight tabular">{stat.value}</p>
            <p
              className={`mt-1 inline-flex items-center gap-1 text-[11px] font-medium tabular ${
                stat.change >= 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {stat.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPct(stat.change)}
            </p>
          </div>
        ))}
      </div>

      <section className="panel mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assets"
              className="w-full rounded-xl border border-border/70 bg-secondary/30 py-2 pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
            />
          </div>
          <select
            value={network}
            onChange={(event) => setNetwork(event.target.value)}
            aria-label="Filter by network"
            className="rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 text-[12px] outline-none sm:w-44"
          >
            <option value="all" className="bg-card">
              All networks
            </option>
            {networks.map((item) => (
              <option key={item.id} value={item.id} className="bg-card">
                {item.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1 rounded-xl bg-secondary/40 p-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  tab === item.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_0.8fr_1fr] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:grid">
          <span>Asset</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h</span>
          <span className="text-right">7d</span>
          <span className="text-right">Volume</span>
        </div>

        <ul className="divide-y divide-border/60">
          {rows.map((coin) => (
            <li
              key={coin.id}
              className="grid grid-cols-[1.6fr_1fr_0.8fr] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-secondary/30 sm:grid-cols-[1.6fr_1fr_0.8fr_0.8fr_1fr]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <CoinAvatar symbol={coin.symbol} color={coin.color} logo={coin.logo} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{coin.name}</p>
                  <p className="text-[11px] text-muted-foreground">{coin.symbol}</p>
                </div>
              </div>
              <span className="text-right text-[13px] tabular">{formatUsd(coin.price)}</span>
              <span
                className={`inline-flex items-center justify-end gap-1 text-[12px] font-medium tabular ${
                  coin.change24h >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {coin.change24h >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {formatPct(coin.change24h)}
              </span>
              <span className="hidden justify-end sm:flex">
                <div className="w-16">
                  <Sparkline data={coin.spark} positive={coin.change7d >= 0} height={26} />
                </div>
              </span>
              <span className="hidden text-right text-[12px] text-muted-foreground tabular sm:block">
                {formatUsd(coin.volume, { compact: true })}
              </span>
            </li>
          ))}
        </ul>
        {rows.length === 0 && (
          <p className="px-5 py-10 text-center text-[12px] text-muted-foreground">No assets match that search.</p>
        )}
      </section>
    </>
  );
}