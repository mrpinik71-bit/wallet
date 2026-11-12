import { createFileRoute } from "@tanstack/react-router";
import HomeHeader from "@/components/wallet/home/HomeHeader";
import BalanceBlock from "@/components/wallet/home/BalanceBlock";
import ActionsRow from "@/components/wallet/home/ActionsRow";
import ScanWorkspace from "@/components/wallet/scan/ScanWorkspace";
import TokensList from "@/components/wallet/home/TokensList";
import AllocationCard from "@/components/wallet/home/AllocationCard";
import SecurityNote from "@/components/wallet/home/SecurityNote";
import usePortfolio from "@/hooks/usePortfolio";

export const Route = createFileRoute("/_authed/")({
  head: () => ({
    meta: [
      { title: "Wallet — Helix" },
      { name: "description", content: "Your live multichain balances, tokens and transfers in one wallet." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { holdings, total, changeValue, changePct, addresses, loading, refresh } = usePortfolio();

  const owned = holdings.filter((item) => item.value > 0);
  const assets = owned.length;
  const chains = new Set(owned.map((item) => item.chain)).size;

  return (
    <div className="relative mx-auto w-full max-w-[458px] lg:max-w-[1080px]">
      <div
        aria-hidden="true"
        className="glow-mint pointer-events-none absolute -top-16 left-1/2 h-48 w-[340px] -translate-x-1/2 opacity-70"
      />

      <div className="relative">
        <HomeHeader address={addresses.tron} />

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start lg:gap-6">
          <div className="lg:col-start-1 lg:row-start-1">
            <BalanceBlock
              total={total}
              changeValue={changeValue}
              changePct={changePct}
              loading={loading}
              assets={assets}
              chains={chains}
            />
            <ActionsRow />
          </div>

          <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
            <div className="mt-3 space-y-2.5 lg:mt-6">
              <AllocationCard holdings={holdings} loading={loading} />
              <SecurityNote />
            </div>
          </div>

          <div className="lg:col-start-1 lg:row-start-3">
            <TokensList holdings={holdings} loading={loading} onRefresh={refresh} />
          </div>
        </div>

        <div className="mt-8">
          <ScanWorkspace />
        </div>

        <p className="mt-9 text-center text-[8.5px] font-medium uppercase tracking-[0.24em] text-muted-foreground/40">
          Live on-chain balances · keys never leave this device
        </p>
      </div>
    </div>
  );
}