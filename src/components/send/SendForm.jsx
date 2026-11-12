import { ArrowLeft, Loader2, ScanLine } from "lucide-react";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { Button } from "@/components/ui/button";
import { chains } from "@/lib/chains/config";
import { formatCrypto, formatUsd } from "@/lib/format";

export default function SendForm({
  coin,
  to,
  onTo,
  amount,
  onAmount,
  fee,
  feeLoading,
  onScan,
  onBack,
  onContinue,
  onMax,
  error,
  busy,
}) {
  const chain = chains[coin.chain];
  const numeric = Number(amount) || 0;
  const ready = to.trim().length > 0 && numeric > 0;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Change asset
      </button>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/25 p-3">
        <CoinAvatar symbol={coin.symbol} color={coin.color} logo={coin.logo} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{coin.name}</p>
          <p className="text-[11px] text-muted-foreground">{chain?.name || coin.chain}</p>
        </div>
        <p className="text-right text-[12px] tabular">
          {formatCrypto(coin.balance)} {coin.symbol}
        </p>
      </div>

      <button
        type="button"
        onClick={onScan}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 py-3 text-[12px] font-medium text-primary transition-colors hover:bg-primary/15"
      >
        <ScanLine className="h-4 w-4" /> Scan QR code
      </button>

      <label className="eyebrow mt-5 block" htmlFor="send-address">
        Recipient address
      </label>
      <input
        id="send-address"
        value={to}
        onChange={(event) => onTo(event.target.value.trim())}
        placeholder={`${chain?.name || coin.chain} address`}
        spellCheck={false}
        autoComplete="off"
        className="mt-2 w-full rounded-xl border border-border/70 bg-secondary/25 px-3 py-3 font-mono text-[12px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
      />

      <div className="mt-5 flex items-end justify-between">
        <label className="eyebrow" htmlFor="send-amount">
          Amount
        </label>
        <button
          type="button"
          onClick={onMax}
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
          onChange={(event) => onAmount(event.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          className="min-w-0 flex-1 bg-transparent font-heading text-xl tabular outline-none placeholder:text-muted-foreground"
        />
        <span className="text-[12px] font-medium text-muted-foreground">{coin.symbol}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground tabular">
        <span>
          ≈ {formatUsd(numeric * coin.price)} · balance {formatCrypto(coin.balance)}
        </span>
        <span>{feeLoading ? "estimating fee…" : fee != null ? `fee ${formatCrypto(fee)} ${chain?.symbol}` : ""}</span>
      </div>

      {error && <p className="mt-3 text-[11px] leading-relaxed text-destructive">{error}</p>}

      <Button
        type="button"
        onClick={onContinue}
        disabled={!ready || busy}
        className="mt-5 h-12 w-full rounded-xl text-[13px] font-semibold"
      >
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Review transfer
      </Button>
    </div>
  );
}