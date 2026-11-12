import { Link } from "@tanstack/react-router";
import { ChevronRight, RefreshCw, Wallet } from "lucide-react";
import TokenRow from "@/components/wallet/home/TokenRow";

export default function TokensList({ holdings, loading, onRefresh }) {
  const empty = !loading && holdings.length === 0;
  const owned = holdings.filter((item) => item.value > 0).length;

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">Assets</h2>
          {!loading && holdings.length > 0 ? (
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular">
              {holdings.length}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh balances"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            to="/markets"
            className="inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-card/60 py-1 pl-2.5 pr-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Markets
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {loading && holdings.length === 0 ? (
        <div className="mt-3 overflow-hidden rounded-[22px] border border-border/70 bg-card/50">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-3 border-b border-border/40 px-4 py-3.5 last:border-0">
              <div className="h-9 w-9 animate-pulse rounded-full bg-secondary/70" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-24 animate-pulse rounded-full bg-secondary/70" />
                <div className="h-2 w-16 animate-pulse rounded-full bg-secondary/50" />
              </div>
              <div className="h-2.5 w-14 animate-pulse rounded-full bg-secondary/70" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && holdings.length > 0 ? (
        <ul className="mt-3 divide-y divide-border/40 overflow-hidden rounded-[22px] border border-border/70 bg-card/50 backdrop-blur">
          {holdings.map((item) => (
            <li key={item.id}>
              <TokenRow item={item} />
            </li>
          ))}
        </ul>
      ) : null}

      {empty ? (
        <div className="mt-3 rounded-[22px] border border-border/70 bg-card/50 px-5 py-7 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary/70 text-muted-foreground">
            <Wallet className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <p className="mt-3 text-[13px] font-medium">No balances yet</p>
          <p className="mx-auto mt-1 max-w-[260px] text-[11.5px] leading-relaxed text-muted-foreground">
            Open Receive to get your address, then fund this wallet from an exchange or another wallet.
          </p>
          <Link
            to="/receive"
            className="mt-3 inline-flex rounded-full bg-primary px-4 py-1.5 text-[11.5px] font-semibold text-primary-foreground"
          >
            Receive
          </Link>
        </div>
      ) : null}

      {!loading && owned === 0 && holdings.length > 0 ? (
        <p className="mt-2.5 px-1 text-[10.5px] text-muted-foreground/70">
          All supported assets are tracked — fund any of them to see a live balance.
        </p>
      ) : null}
    </section>
  );
}