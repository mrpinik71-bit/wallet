import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import MarketStats from "@/components/markets/MarketStats";
import MarketRow from "@/components/markets/MarketRow";
import MarketsToolbar from "@/components/markets/MarketsToolbar";
import MarketsSkeleton from "@/components/markets/MarketsSkeleton";
import useMarkets from "@/hooks/useMarkets";
import { networkLabel } from "@/lib/markets";

export const Route = createFileRoute("/_authed/markets")({
  head: () => ({
    meta: [
      { title: "Markets — Helix" },
      { name: "description", content: "Live prices, momentum and volume across every asset this wallet supports." },
    ],
  }),
  component: Markets,
});

function Markets() {
  const { coins, globals, loading, error, updatedAt, refresh } = useMarkets();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("cap");
  const [network, setNetwork] = useState("all");

  const networkOptions = useMemo(() => {
    const ids = [...new Set(coins.map((coin) => coin.network).filter(Boolean))];
    return ids
      .map((id) => ({ id, name: networkLabel(id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [coins]);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = coins.filter(
      (coin) =>
        (network === "all" || coin.network === network) &&
        (!term ||
          coin.name.toLowerCase().includes(term) ||
          coin.symbol.toLowerCase().includes(term) ||
          networkLabel(coin.network).toLowerCase().includes(term)),
    );
    if (tab === "gainers") return [...filtered].sort((a, b) => b.change24h - a.change24h);
    if (tab === "losers") return [...filtered].sort((a, b) => a.change24h - b.change24h);
    if (tab === "volume") return [...filtered].sort((a, b) => b.volume - a.volume);
    return [...filtered].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }, [coins, query, tab, network]);

  const stamp = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Research"
        title="Markets"
        description="Live prices from the public market feed — 24-hour momentum, seven-day trend, volume and dominance."
      />

      <MarketStats globals={globals} loading={loading && !globals} />

      <section className="mt-4 overflow-hidden rounded-2xl border border-foreground/[0.07] bg-card/60">
        <MarketsToolbar
          query={query}
          onQuery={setQuery}
          tab={tab}
          onTab={setTab}
          network={network}
          onNetwork={setNetwork}
          networkOptions={networkOptions}
          onRefresh={refresh}
          refreshing={loading}
        />

        <div className="hidden grid-cols-[minmax(0,1fr)_78px_104px_112px] gap-3 border-b border-foreground/[0.06] px-4 py-2.5 text-[8.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground/50 sm:grid">
          <span>Asset</span>
          <span className="text-right">7d trend</span>
          <span className="text-right">Price</span>
          <span className="text-right">Market cap · Volume</span>
        </div>

        {loading && coins.length === 0 ? <MarketsSkeleton /> : null}

        {error && coins.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <AlertTriangle className="h-5 w-5 text-destructive/80" strokeWidth={1.7} />
            <p className="max-w-[280px] text-[11.5px] leading-relaxed text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="rounded-full border border-foreground/[0.12] px-3.5 py-1.5 text-[11px] font-medium text-foreground"
            >
              Try again
            </button>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <ul className="divide-y divide-foreground/[0.05]">
            {rows.map((coin) => (
              <MarketRow key={coin.id} coin={coin} />
            ))}
          </ul>
        ) : null}

        {!loading && !error && rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-[11.5px] text-muted-foreground">No assets match that filter.</p>
        ) : null}
      </section>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/40">
        {stamp ? `Live · updated ${stamp}` : "Live market feed"}
      </p>
    </>
  );
}