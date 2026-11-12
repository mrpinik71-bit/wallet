import CoinAvatar from "@/components/wallet/CoinAvatar";
import { formatCrypto, formatUsd } from "@/lib/format";

export default function SwapAmount({ label, amount, onAmount, coin, options, onPick, balance, onMax, usd, placeholder = "0.00" }) {
  const editable = typeof onAmount === "function";

  return (
    <div className="rounded-2xl border border-foreground/[0.07] bg-foreground/[0.022] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[8.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">{label}</p>
        {coin && balance != null ? (
          editable ? (
            <button
              type="button"
              onClick={onMax}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.05] px-2.5 py-1 text-[9.5px] font-medium text-muted-foreground transition-colors hover:text-foreground num"
            >
              {formatCrypto(balance)} {coin.symbol}
              <span className="text-primary">Max</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.04] px-2.5 py-1 text-[9.5px] font-medium text-muted-foreground/70 num">
              {formatCrypto(balance)} {coin.symbol}
            </span>
          )
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-3">
        {editable ? (
          <input
            inputMode="decimal"
            value={amount}
            onChange={(event) => onAmount(event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent font-display text-[28px] leading-none tracking-tight num outline-none placeholder:text-muted-foreground/30"
          />
        ) : (
          <p className={`min-w-0 flex-1 truncate font-display text-[28px] leading-none tracking-tight num ${amount ? "text-primary" : "text-muted-foreground/30"}`}>
            {amount || placeholder}
          </p>
        )}

        {coin ? (
          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-foreground/[0.09] bg-background/60 py-1.5 pl-1.5 pr-2">
            <CoinAvatar symbol={coin.symbol} color={coin.color} logo={coin.logo} size="sm" />
            <select
              value={coin.id}
              onChange={(event) => onPick(event.target.value)}
              aria-label={`${label} asset`}
              className="max-w-[86px] appearance-none bg-transparent text-[12px] font-semibold outline-none"
            >
              {options.map((item) => (
                <option key={item.id} value={item.id} className="bg-card">
                  {item.symbol}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <p className="mt-2 text-[10.5px] text-muted-foreground/70 num">≈ {formatUsd(usd || 0)}</p>
    </div>
  );
}