import { useState } from "react";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chains } from "@/lib/chains/config";
import { formatCrypto, formatUsd } from "@/lib/format";

export default function ConfirmStep({ coin, to, amount, fee, feeUsd, onBack, onConfirm, busy, error }) {
  const [pin, setPin] = useState("");
  const chain = chains[coin.chain];
  const numeric = Number(amount) || 0;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Edit transfer
      </button>

      <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight">Confirm transfer</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        On-chain transfers cannot be reversed. Enter your 4-digit PIN to sign and broadcast.
      </p>

      <dl className="mt-4 space-y-3 rounded-2xl border border-border/70 bg-secondary/20 p-4 text-[12px]">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="text-right font-medium tabular">
            {formatCrypto(numeric)} {coin.symbol}
            <span className="block text-[11px] font-normal text-muted-foreground">
              {formatUsd(numeric * coin.price)}
            </span>
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">To</dt>
          <dd className="max-w-[62%] break-all text-right font-mono text-[11px]">{to}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Network</dt>
          <dd>{chain?.name || coin.chain}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <dt className="text-muted-foreground">Network fee</dt>
          <dd className="text-right tabular">
            {fee != null ? `${formatCrypto(fee)} ${chain?.symbol}` : "estimating…"}
            {feeUsd ? <span className="block text-[11px] text-muted-foreground">{formatUsd(feeUsd)}</span> : null}
          </dd>
        </div>
      </dl>

      <label className="eyebrow mt-5 block" htmlFor="confirm-pin">
        Wallet PIN
      </label>
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/25 px-3 py-2.5">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <input
          id="confirm-pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="••••"
          className="min-w-0 flex-1 bg-transparent text-center font-mono text-lg tracking-[0.6em] outline-none placeholder:text-muted-foreground"
        />
      </div>

      {error && <p className="mt-3 text-[11px] leading-relaxed text-destructive">{error}</p>}

      <Button
        type="button"
        onClick={() => onConfirm(pin)}
        disabled={pin.length !== 4 || busy}
        className="mt-5 h-12 w-full rounded-xl text-[13px] font-semibold"
      >
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {busy ? "Broadcasting…" : "Confirm & send"}
      </Button>
    </div>
  );
}