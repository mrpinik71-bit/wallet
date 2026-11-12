import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import PortfolioHero from "@/components/wallet/PortfolioHero";
import AssetList from "@/components/wallet/AssetList";
import RecentActivity from "@/components/wallet/RecentActivity";
import Sparkline from "@/components/wallet/Sparkline";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { markets } from "@/lib/sample-wallet";
import { formatPct, formatUsd } from "@/lib/format";

export const Route = createFileRoute("/_authed/")({
  head: () => ({
    meta: [
      { title: "Overview — Helix Wallet" },
      { name: "description", content: "Your multichain portfolio, assets and recent activity in one place." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const movers = [...markets].sort((a, b) => b.change24h - a.change24h).slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Good morning"
        description="A single view of every chain you hold. Balances are shown in sample mode until your wallet is connected."
        action={
          <Link
            to="/wallet"
            className="inline-flex items-center gap-2 self-start rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Wallet security
          </Link>
        }
      />

      <PortfolioHero />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <AssetList />

          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold tracking-tight">Watchlist</h2>
              <Link
                to="/markets"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                All markets <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {movers.map((coin) => (
                <div key={coin.id} className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <div className="flex items-center gap-2">
                    <CoinAvatar symbol={coin.symbol} color={coin.color} size="sm" />
                    <span className="text-[12px] font-medium">{coin.symbol}</span>
                    <span
                      className={`ml-auto text-[11px] font-medium tabular ${
                        coin.change24h >= 0 ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {formatPct(coin.change24h)}
                    </span>
                  </div>
                  <p className="mt-2 text-[15px] font-medium tabular">{formatUsd(coin.price)}</p>
                  <div className="mt-1">
                    <Sparkline data={coin.spark} positive={coin.change24h >= 0} height={26} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <RecentActivity />
          <section className="panel overflow-hidden">
            <div className="border-b border-border/70 px-5 py-4">
              <h2 className="font-heading text-sm font-semibold tracking-tight">Network status</h2>
            </div>
            <ul className="divide-y divide-border/60">
              {[
                { name: "Bitcoin", latency: "12 ms", ok: true },
                { name: "Ethereum", latency: "24 ms", ok: true },
                { name: "Solana", latency: "18 ms", ok: true },
                { name: "Tron", latency: "31 ms", ok: true },
              ].map((net) => (
                <li key={net.name} className="flex items-center justify-between px-5 py-3">
                  <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {net.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular">{net.latency}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}