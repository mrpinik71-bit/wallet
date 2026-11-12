import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Info, Loader2, Repeat } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { assets } from "@/lib/sample-wallet";
import { formatAmount, formatUsd } from "@/lib/format";

export const Route = createFileRoute("/_authed/swap")({
  head: () => ({
    meta: [
      { title: "Swap — Helix" },
      { name: "description", content: "Swap between assets with an upfront rate, fee and slippage preview." },
    ],
  }),
  component: Swap,
});

const FEE_RATE = 0.006;

function Swap() {
  const [fromId, setFromId] = useState("eth");
  const [toId, setToId] = useState("usdt");
  const [amount, setAmount] = useState("1");
  const [slippage, setSlippage] = useState("0.5");

  const from = assets.find((item) => item.id === fromId);
  const to = assets.find((item) => item.id === toId);
  const numericAmount = Number(amount) || 0;

  const rate = from.price / to.price;
  const gross = numericAmount * rate;
  const fee = gross * FEE_RATE;
  const received = Math.max(0, gross - fee);
  const tooMuch = numericAmount > from.amount;

  function flip() {
    setFromId(toId);
    setToId(fromId);
  }

  return (
    <>
      <PageHeader
        eyebrow="Exchange"
        title="Swap"
        description="Routing and rates are quoted before anything is signed, so the amount you receive is never a surprise."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="panel p-5">
          <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
            <div className="flex items-center justify-between">
              <p className="eyebrow">You pay</p>
              <span className="text-[11px] text-muted-foreground tabular">
                {formatAmount(from.amount, from.symbol)} available
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <input
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                className="min-w-0 flex-1 bg-transparent font-display text-3xl tabular outline-none"
                placeholder="0.00"
              />
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-2.5 py-2">
                <CoinAvatar symbol={from.symbol} color={from.color} size="sm" />
                <select
                  value={fromId}
                  onChange={(event) => setFromId(event.target.value)}
                  className="bg-transparent text-[12px] font-medium outline-none"
                >
                  {assets.map((item) => (
                    <option key={item.id} value={item.id} className="bg-card">
                      {item.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground tabular">
              ≈ {formatUsd(numericAmount * from.price)}
            </p>
          </div>

          <div className="relative z-10 -my-3 flex justify-center">
            <button
              type="button"
              onClick={flip}
              aria-label="Switch assets"
              className="rounded-full border border-border/70 bg-card p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
            <p className="eyebrow">You receive</p>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="min-w-0 flex-1 font-display text-3xl tabular text-primary">
                {received ? received.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "0.00"}
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-2.5 py-2">
                <CoinAvatar symbol={to.symbol} color={to.color} size="sm" />
                <select
                  value={toId}
                  onChange={(event) => setToId(event.target.value)}
                  className="bg-transparent text-[12px] font-medium outline-none"
                >
                  {assets.map((item) => (
                    <option key={item.id} value={item.id} className="bg-card">
                      {item.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground tabular">≈ {formatUsd(received * to.price)}</p>
          </div>

          {tooMuch && <p className="mt-3 text-[11px] text-destructive">You do not hold that much {from.symbol}.</p>}
        </section>

        <aside className="panel h-fit p-5">
          <h2 className="font-heading text-sm font-semibold tracking-tight">Quote</h2>
          <dl className="mt-4 space-y-3 text-[12px]">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Rate</dt>
              <dd className="tabular">
                1 {from.symbol} = {rate.toLocaleString("en-US", { maximumFractionDigits: 4 })} {to.symbol}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Liquidity fee</dt>
              <dd className="tabular">{(FEE_RATE * 100).toFixed(1)}%</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Slippage</dt>
              <dd>
                <select
                  value={slippage}
                  onChange={(event) => setSlippage(event.target.value)}
                  className="rounded-lg border border-border/70 bg-secondary/40 px-2 py-1 text-[11px] outline-none"
                >
                  <option value="0.1">0.1%</option>
                  <option value="0.5">0.5%</option>
                  <option value="1">1.0%</option>
                </select>
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <dt className="text-muted-foreground">Route</dt>
              <dd className="inline-flex items-center gap-1.5">
                {from.symbol} <Repeat className="h-3 w-3 text-muted-foreground" /> {to.symbol}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            disabled
            className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-primary/25 px-4 py-3 text-[13px] font-semibold text-primary/70"
          >
            <Loader2 className="h-4 w-4" /> Swap
          </button>

          <div className="mt-3 flex gap-2 rounded-xl border border-border/70 bg-secondary/20 p-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Swaps execute once routing is connected to live liquidity. The quote above uses current
              reference prices.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}