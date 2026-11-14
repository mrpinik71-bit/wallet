import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, Loader2 } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import SwapAmount from "@/components/swap/SwapAmount";
import QuotePanel from "@/components/swap/QuotePanel";
import usePortfolio from "@/hooks/usePortfolio";
import { dexSwapLink } from "@/lib/dex-links";
import { networkLabel } from "@/lib/markets";
import { formatCrypto } from "@/lib/format";

export const Route = createFileRoute("/_authed/swap")({
  validateSearch: (search) => ({ coin: typeof search.coin === "string" ? search.coin : undefined }),
  head: () => ({
    meta: [
      { title: "Swap — Helix" },
      { name: "description", content: "Quote a swap against live prices and your on-chain balances before you trade." },
    ],
  }),
  component: Swap,
});

const FEE_RATE = 0.003;

function pickTarget(list, baseId) {
  const base = list.find((item) => item.id === baseId);
  if (!base) return null;
  const partners = list.filter((item) => item.chain === base.chain && item.id !== base.id);
  return partners.find((item) => item.balance > 0) || partners[0] || null;
}

function Swap() {
  const search = Route.useSearch();
  const { holdings, loading } = usePortfolio();
  const [fromId, setFromId] = useState(null);
  const [toId, setToId] = useState(null);
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");

  const tradable = useMemo(
    () => holdings.filter((item) => holdings.some((other) => other.chain === item.chain && other.id !== item.id)),
    [holdings],
  );

  useEffect(() => {
    if (loading || tradable.length === 0) return;
    // Already on a real asset: nothing to choose.
    if (fromId && tradable.some((item) => item.id === fromId)) return;
    // A coin handed over by the assistant wins over the default.
    const wanted = search.coin ? tradable.find((item) => item.id === search.coin) : null;
    const base = wanted || tradable.find((item) => item.balance > 0) || tradable[0];
    const target = pickTarget(holdings, base.id);
    if (!target) return;
    setFromId(base.id);
    setToId(target.id);
  }, [loading, tradable, holdings, fromId, search.coin]);

  const from = holdings.find((item) => item.id === fromId) || null;
  const to = holdings.find((item) => item.id === toId) || null;

  const fromOptions = tradable;
  const toOptions = useMemo(
    () => (from ? tradable.filter((item) => item.chain === from.chain && item.id !== from.id) : []),
    [tradable, from],
  );

  const numeric = Number(amount) || 0;
  const rate = from && to && to.price > 0 ? from.price / to.price : 0;
  const gross = numeric * rate;
  const fee = gross * FEE_RATE;
  const received = Math.max(0, gross - fee);
  const minReceived = received * (1 - Number(slippage) / 100);
  const link = dexSwapLink(from, to);

  const overBalance = Boolean(from) && numeric > from.balance;
  const ready = Boolean(link) && numeric > 0 && !overBalance;
  const error = overBalance
    ? `You only hold ${formatCrypto(from.balance)} ${from.symbol}.`
    : numeric > 0 && !link
      ? "This network has no supported route yet."
      : "";

  function pickFrom(id) {
    setFromId(id);
    const target = pickTarget(holdings, id);
    if (target && target.id !== toId) setToId(target.id);
    setAmount("");
  }

  function pickTo(id) {
    setToId(id);
  }

  function flip() {
    if (!from || !to) return;
    setFromId(to.id);
    setToId(from.id);
    setAmount(received ? formatCrypto(received).replace(/,/g, "") : "");
  }

  function useMax() {
    if (!from) return;
    setAmount(from.balance ? String(Number(from.balance.toFixed(8))) : "");
  }

  if (!loading && tradable.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[460px]">
        <PageHeader eyebrow="Exchange" title="Swap" />
        <div className="rounded-2xl border border-foreground/[0.07] bg-card/60 p-6 text-center">
          <p className="text-[12.5px] font-medium">Nothing to swap yet</p>
          <p className="mx-auto mt-2 max-w-[280px] text-[11px] leading-relaxed text-muted-foreground">
            Swaps need two assets on the same network. Receive funds first, then come back to trade.
          </p>
          <Link
            to="/receive"
            className="mt-4 inline-flex rounded-xl bg-action px-4 py-2.5 text-[11.5px] font-semibold text-action-foreground"
          >
            Receive assets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <PageHeader eyebrow="Exchange" title="Swap" />

      {loading && !from ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-foreground/[0.07] bg-card/60 py-16 text-[11px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading balances…
        </div>
      ) : null}

      {from && to ? (
        <div className="space-y-2.5">
          <SwapAmount
            label="You pay"
            amount={amount}
            onAmount={setAmount}
            coin={from}
            options={fromOptions}
            onPick={pickFrom}
            balance={from.balance}
            onMax={useMax}
            usd={numeric * from.price}
          />

          <div className="relative z-10 -my-4 flex justify-center">
            <button
              type="button"
              onClick={flip}
              aria-label="Switch assets"
              className="grid h-8 w-8 place-items-center rounded-full border border-foreground/[0.1] bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <SwapAmount
            label="You receive"
            amount={received ? formatCrypto(received) : ""}
            coin={to}
            options={toOptions}
            onPick={pickTo}
            balance={to.balance}
            usd={received * to.price}
          />

          <QuotePanel
            from={from}
            to={to}
            rate={rate}
            fee={fee}
            minReceived={minReceived}
            slippage={slippage}
            onSlippage={setSlippage}
            network={networkLabel(from.chain)}
            link={link}
            error={error}
            ready={ready}
          />
        </div>
      ) : null}
    </div>
  );
}