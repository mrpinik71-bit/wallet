import { ArrowUpRight, Info, Repeat, ShieldCheck } from "lucide-react";
import { formatCrypto } from "@/lib/format";

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="text-[11px] text-muted-foreground/80">{label}</dt>
      <dd className="text-right text-[11.5px] font-medium num">{children}</dd>
    </div>
  );
}

export default function QuotePanel({ from, to, rate, fee, minReceived, slippage, onSlippage, network, link, error, ready }) {
  return (
    <aside className="flex flex-col rounded-2xl border border-foreground/[0.07] bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[13px] font-semibold tracking-tight">Quote</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.05] px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
          <ShieldCheck className="h-2.5 w-2.5" /> Live
        </span>
      </div>

      <dl className="mt-2.5 divide-y divide-foreground/[0.05]">
        <Row label="Rate">
          {from && to ? (
            <span>
              1 {from.symbol} = {rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} {to.symbol}
            </span>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Liquidity fee">
          {from && to ? fee.toLocaleString("en-US", { maximumFractionDigits: 6 }) + ` ${to.symbol}` : "—"}
        </Row>
        <Row label="Slippage">
          <select
            value={slippage}
            onChange={(event) => onSlippage(event.target.value)}
            className="rounded-lg border border-foreground/[0.09] bg-foreground/[0.04] px-1.5 py-0.5 text-[10.5px] outline-none"
          >
            <option value="0.1">0.1%</option>
            <option value="0.5">0.5%</option>
            <option value="1">1.0%</option>
          </select>
        </Row>
        <Row label="Minimum received">
          {from && to && minReceived ? `${formatCrypto(minReceived)} ${to.symbol}` : "—"}
        </Row>
        <Row label="Network">{network || "—"}</Row>
        <Row label="Route">
          {from && to ? (
            <span className="inline-flex items-center gap-1.5">
              {from.symbol} <Repeat className="h-3 w-3 text-muted-foreground/60" /> {to.symbol}
            </span>
          ) : (
            "—"
          )}
        </Row>
      </dl>

      {link ? (
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!ready}
          onClick={(event) => {
            if (!ready) event.preventDefault();
          }}
          className={`mt-4 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-[12.5px] font-semibold text-primary-foreground shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.9)] transition-opacity ${
            ready ? "opacity-100" : "pointer-events-none opacity-35"
          }`}
        >
          Continue on {link.name}
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 flex h-11 cursor-not-allowed items-center justify-center rounded-xl bg-foreground/[0.06] text-[12px] font-semibold text-muted-foreground/60"
        >
          No route for this pair
        </button>
      )}

      {error ? <p className="mt-2.5 text-center text-[10.5px] text-destructive">{error}</p> : null}

      <div className="mt-3 flex gap-2 rounded-xl border border-foreground/[0.07] bg-foreground/[0.022] p-2.5">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/70" />
        <p className="text-[10px] leading-relaxed text-muted-foreground/80">
          The quote above uses live reference prices. Execution opens in {link?.name || "a chain exchange"}, signed from
          this wallet, so your phrase never leaves the device.
        </p>
      </div>
    </aside>
  );
}