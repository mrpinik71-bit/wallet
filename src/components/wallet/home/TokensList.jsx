import { Link } from "@tanstack/react-router";
import { ChevronRight, RefreshCw, Wallet } from "lucide-react";
import TokenRow from "@/components/wallet/home/TokenRow";

export default function TokensList({ holdings, loading, onRefresh }) {
  const empty = !loading && holdings.length === 0;
  const owned = holdings.filter((item) => item.value > 0).length;
  const discovered = holdings.filter((item) => item.discovered).length;

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-[14px] font-semibold tracking-tight">Assets</h2>
          {!loading && holdings.length > 0 ? (
            <span className="rounded-full border border-foreground/[0.08] px-1.5 py-px text-[9px] font-medium text-muted-foreground/80 num">
              {holdings.length}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh balances"
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground/70 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} strokeWidth={1.9} />
          </button>
          <Link
            to="/markets"
            className="inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            Markets
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {loading && holdings.length === 0 ? (
        <div className="mt-3 overflow-hidden rounded-[22px] border border-foreground/[0.07] bg-foreground/[0.02]">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-3 border-b border-foreground/[0.05] px-4 py-3.5 last:border-0">
              <div className="h-9 w-9 animate-pulse rounded-full bg-foreground/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-24 animate-pulse rounded-full bg-foreground/[0.06]" />
                <div className="h-2 w-16 animate-pulse rounded-full bg-foreground/[0.04]" />
              </div>
              <div className="h-2.5 w-14 animate-pulse rounded-full bg-foreground/[0.06]" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && holdings.length > 0 ? (
        <ul className="mt-3 divide-y divide-foreground/[0.05] overflow-hidden rounded-[22px] border border-foreground/[0.07] bg-foreground/[0.02]">
          {holdings.map((item) => (
            <li key={item.id}>
              <TokenRow item={item} />
            </li>
          ))}
        </ul>
      ) : null}

      {empty ? (
        <div className="lux noise mt-3 px-5 py-7 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-foreground/[0.08] bg-foreground/[0.03] text-muted-foreground">
            <Wallet className="h-4 w-4" strokeWidth={1.7} />
          </span>
          <p className="relative mt-3 font-display text-[19px] leading-tight">No balances yet</p>
          <p className="relative mx-auto mt-1.5 max-w-[260px] text-[11px] leading-relaxed text-muted-foreground">
            Open Receive to get your address, then fund this wallet from an exchange or another wallet.
          </p>
          <Link
            to="/receive"
            className="relative mt-4 inline-flex rounded-full bg-primary px-4 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-[0_16px_34px_-20px_hsl(var(--primary)/0.9)]"
          >
            Receive
          </Link>
        </div>
      ) : null}

      {discovered > 0 ? (
        <p className="mt-2.5 px-1 text-[10px] leading-relaxed text-muted-foreground/60">
          {discovered} other token{discovered === 1 ? "" : "s"} found on your addresses, including airdrops and meme
          tokens — they carry no price quote yet, so only the amount is shown.
        </p>
      ) : null}

      {!loading && owned === 0 && holdings.length > 0 ? (
        <p className="mt-2.5 px-1 text-[10px] text-muted-foreground/60">
          All supported assets are tracked — fund any of them to see a live balance.
        </p>
      ) : null}
    </section>
  );
}