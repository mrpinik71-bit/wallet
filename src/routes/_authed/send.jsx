import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Info } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { assets } from "@/lib/sample-wallet";
import { formatAmount, formatUsd } from "@/lib/format";

export const Route = createFileRoute("/_authed/send")({
  head: () => ({
    meta: [
      { title: "Send — Helix" },
      { name: "description", content: "Send crypto to any address with a clear fee preview before you sign." },
    ],
  }),
  component: Send,
});

function Send() {
  const [assetId, setAssetId] = useState("eth");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const asset = assets.find((item) => item.id === assetId);
  const numericAmount = Number(amount) || 0;
  const valueUsd = numericAmount * asset.price;
  const networkFee = asset.chain === "Ethereum" ? 2.14 : asset.chain === "Bitcoin" ? 0.86 : 0.0004;

  const amountValid = numericAmount > 0 && numericAmount <= asset.amount;
  const addressValid = recipient.trim().length >= 20;
  const ready = amountValid && addressValid;

  return (
    <>
      <PageHeader
        eyebrow="Transfer"
        title="Send"
        description="Double-check the address — transfers on-chain cannot be reversed once they are signed."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form className="panel p-5" onSubmit={(event) => event.preventDefault()}>
          <label className="eyebrow" htmlFor="send-asset">
            Asset
          </label>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/25 p-2.5">
            <CoinAvatar symbol={asset.symbol} color={asset.color} />
            <select
              id="send-asset"
              value={assetId}
              onChange={(event) => setAssetId(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
            >
              {assets.map((item) => (
                <option key={item.id} value={item.id} className="bg-card">
                  {item.name} · {item.chain}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-muted-foreground tabular">
              {formatAmount(asset.amount, asset.symbol)}
            </span>
          </div>

          <label className="eyebrow mt-5 block" htmlFor="send-recipient">
            Recipient address
          </label>
          <input
            id="send-recipient"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder={`${asset.chain} address`}
            spellCheck={false}
            className="mt-2 w-full rounded-xl border border-border/70 bg-secondary/25 px-3 py-3 font-mono text-[12px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
          />

          <div className="mt-5 flex items-end justify-between">
            <label className="eyebrow" htmlFor="send-amount">
              Amount
            </label>
            <button
              type="button"
              onClick={() => setAmount(String(asset.amount))}
              className="text-[11px] font-medium text-primary transition-opacity hover:opacity-80"
            >
              Use max
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/25 px-3 py-2.5">
            <input
              id="send-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="min-w-0 flex-1 bg-transparent font-heading text-lg tabular outline-none placeholder:text-muted-foreground"
            />
            <span className="text-[12px] font-medium text-muted-foreground">{asset.symbol}</span>
          </div>
          <p className="mt-1.5 text-right text-[11px] text-muted-foreground tabular">≈ {formatUsd(valueUsd)}</p>

          {amount !== "" && !amountValid && (
            <p className="mt-2 text-[11px] text-destructive">Enter an amount within your available balance.</p>
          )}
        </form>

        <aside className="panel h-fit p-5">
          <h2 className="font-heading text-sm font-semibold tracking-tight">Summary</h2>
          <dl className="mt-4 space-y-3 text-[12px]">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Network</dt>
              <dd>{asset.chain}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="tabular">{numericAmount ? formatAmount(numericAmount, asset.symbol) : "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Network fee</dt>
              <dd className="tabular">{formatUsd(networkFee)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-medium tabular">{formatUsd(valueUsd + (ready ? networkFee : 0))}</dd>
            </div>
          </dl>

          <button
            type="button"
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-xl bg-primary/25 px-4 py-3 text-[13px] font-semibold text-primary/70"
          >
            <span className="inline-flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" /> Review & send
            </span>
          </button>

          <div className="mt-3 flex gap-2 rounded-xl border border-border/70 bg-secondary/20 p-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Sending unlocks once your wallet is linked to a live network. No transaction can leave
              this build today.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}