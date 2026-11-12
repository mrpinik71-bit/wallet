import { Link } from "@tanstack/react-router";
import { ChevronRight, RefreshCw } from "lucide-react";
import TokenRow from "@/components/wallet/home/TokenRow";

export default function TokensList({ holdings, loading, onRefresh }) {
  return (
    <section className="mt-7">
      <div className="flex items-center justify-between px-1">
        <Link to="/markets" className="inline-flex items-center gap-1 font-heading text-[15px] font-semibold tracking-tight">
          Tokens <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh balances"
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && holdings.length === 0 ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-3 py-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-secondary/70" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-24 animate-pulse rounded-full bg-secondary/70" />
                <div className="h-2 w-16 animate-pulse rounded-full bg-secondary/50" />
              </div>
              <div className="h-2.5 w-14 animate-pulse rounded-full bg-secondary/70" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-border/40">
          {holdings.map((item) => (
            <li key={item.id}>
              <TokenRow item={item} />
            </li>
          ))}
        </ul>
      )}

      {!loading && holdings.length === 0 && (
        <p className="mt-4 rounded-2xl border border-border/70 bg-secondary/20 p-4 text-center text-[12px] leading-relaxed text-muted-foreground">
          No balances found for this wallet yet. Tap Receive to get your address and fund it.
        </p>
      )}
    </section>
  );
}