import { Check, Copy, Share2 } from "lucide-react";
import QrCode from "@/components/wallet/QrCode";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { chains } from "@/lib/chains/config";

export default function AddressCard({ coin, address, copied, onCopy, onShare }) {
  const chain = chains[coin.chain];

  return (
    <section className="lux noise relative overflow-hidden p-5">
      <div className="relative flex items-center gap-3">
        <CoinAvatar symbol={coin.symbol} color={coin.color} logo={coin.logo} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-[15px] font-semibold tracking-tight">{coin.name}</p>
          <p className="mt-1 truncate text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
            {chain?.name} · {coin.symbol}
          </p>
        </div>
        <button
          type="button"
          onClick={onShare}
          aria-label="Share address"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-foreground/[0.1] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative mt-4 flex justify-center rounded-2xl bg-foreground/[0.035] p-4 ring-1 ring-inset ring-foreground/[0.06]">
        <QrCode value={address} size={192} />
      </div>

      <p className="relative mt-4 break-all text-center font-mono text-[11.5px] leading-relaxed text-muted-foreground/90">
        {address || "Generating address…"}
      </p>

      <button
        type="button"
        onClick={onCopy}
        disabled={!address}
        className="relative mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-action text-[12.5px] font-semibold text-action-foreground transition-opacity disabled:opacity-50"
      >
        {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2} />}
        {copied ? "Address copied" : "Copy address"}
      </button>

      <p className="relative mt-3 text-center text-[10px] leading-relaxed text-muted-foreground/65">
        Send only {coin.symbol} on {chain?.name} to this address. Assets sent on another network cannot be recovered.
      </p>
    </section>
  );
}