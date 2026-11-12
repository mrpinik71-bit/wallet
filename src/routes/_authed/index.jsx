import { createFileRoute } from "@tanstack/react-router";
import HomeHeader from "@/components/wallet/home/HomeHeader";
import BalanceBlock from "@/components/wallet/home/BalanceBlock";
import ActionsRow from "@/components/wallet/home/ActionsRow";
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

  return (
    <div className="mx-auto w-full max-w-[460px] lg:max-w-[1080px]">
      <HomeHeader address={addresses.tron} />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start lg:gap-6">
        <div className="lg:col-start-1 lg:row-start-1">
          <BalanceBlock total={total} changeValue={changeValue} changePct={changePct} loading={loading} />
          <ActionsRow />
        </div>

        <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <div className="mt-5 space-y-3 lg:mt-6">
            <AllocationCard holdings={holdings} loading={loading} />
            <SecurityNote />
          </div>
        </div>

        <div className="lg:col-start-1 lg:row-start-3">
          <TokensList holdings={holdings} loading={loading} onRefresh={refresh} />
        </div>
      </div>

      <p className="mt-9 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/50">
        Live on-chain balances · keys never leave this device
      </p>
    </div>
  );
}