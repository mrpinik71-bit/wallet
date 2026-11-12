import { createFileRoute } from "@tanstack/react-router";
import HomeHeader from "@/components/wallet/home/HomeHeader";
import BalanceBlock from "@/components/wallet/home/BalanceBlock";
import ActionsRow from "@/components/wallet/home/ActionsRow";
import TokensList from "@/components/wallet/home/TokensList";
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
    <div className="mx-auto w-full max-w-[440px] overflow-x-hidden">
      <HomeHeader address={addresses.tron} />
      <BalanceBlock total={total} changeValue={changeValue} changePct={changePct} loading={loading} />
      <ActionsRow />
      <TokensList holdings={holdings} loading={loading} onRefresh={refresh} />
      <p className="mt-10 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
        Live on-chain balances · keys stay on this device
      </p>
    </div>
  );
}