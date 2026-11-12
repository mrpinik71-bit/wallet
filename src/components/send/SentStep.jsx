import { Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { explorerTx } from "@/lib/chains/config";
import { formatCrypto } from "@/lib/format";

export default function SentStep({ coin, amount, hash, onDone }) {
  const url = explorerTx(coin.chain, hash);

  return (
    <div className="flex flex-col items-center text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight">Transfer broadcast</h2>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
        {formatCrypto(Number(amount))} {coin.symbol} is on its way. It confirms as soon as the network includes it.
      </p>

      <div className="mt-4 w-full rounded-2xl border border-border/70 bg-secondary/20 p-3">
        <p className="eyebrow">Transaction hash</p>
        <p className="mt-1.5 break-all font-mono text-[11px] leading-relaxed">{hash}</p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary"
          >
            View on explorer <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <Button asChild className="mt-5 h-12 w-full rounded-xl text-[13px] font-semibold">
        <Link to="/" onClick={onDone}>
          Back to wallet
        </Link>
      </Button>
    </div>
  );
}