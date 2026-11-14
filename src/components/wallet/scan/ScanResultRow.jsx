import { useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { SCAN_CHAINS } from "@/lib/chains/scan-catalog";
import { formatUsd } from "@/lib/format";

function shortAddress(value) {
  if (!value) return "";
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function compactAmount(value) {
  if (!value) return "0";
  if (value < 0.0001) return value.toPrecision(4);
  if (value < 1) return value.toFixed(6).replace(/0+$/, "");
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value < 1000 ? 4 : 2 }).format(value);
}

export default function ScanResultRow({ result, index }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const funded = result.funded || [];
  const hasBalance = result.total > 0;
  const invalid = result.status === "invalid";

  const addressRows = [
    { label: "EVM · all networks", value: result.addresses?.ethereum },
    { label: "Bitcoin", value: result.addresses?.bitcoin },
    { label: "Litecoin", value: result.addresses?.litecoin },
    { label: "Dogecoin", value: result.addresses?.dogecoin },
    { label: "Dash", value: result.addresses?.dash },
    { label: "XRP", value: result.addresses?.xrp },
    { label: "Cardano", value: result.addresses?.cardano },
    { label: "Polkadot", value: result.addresses?.polkadot },
    { label: "Aptos", value: result.addresses?.aptos },
    { label: "NEAR", value: result.addresses?.near },
    { label: "TON", value: result.addresses?.ton },
    { label: "Sui", value: result.addresses?.sui },
    { label: "Solana", value: result.addresses?.solana },
    { label: "TRON", value: result.addresses?.tron },
  ].filter((row) => row.value);

  // How many networks were really asked: every EVM network shares one address,
  // and a 12-word phrase has no TON address, so the number is not the row count.
  const scannedChains = SCAN_CHAINS.filter((chain) => result.addresses?.[chain]).length;

  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(""), 1400);
    } catch {
      setCopied("");
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-[18px] border transition-colors ${
        hasBalance
          ? "border-primary/30 bg-primary/[0.05]"
          : "border-foreground/[0.07] bg-foreground/[0.02]"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-medium">
            {invalid
              ? result.line
                ? `Line ${result.line} · unreadable`
                : "Unreadable phrase"
              : result.line
                ? `Line ${result.line}`
                : `Wallet ${index + 1}`}
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-muted-foreground/70">
            {invalid
              ? result.error
              : hasBalance
                ? funded
                    .slice(0, 3)
                    .map((item) => `${compactAmount(item.balance)} ${item.symbol}`)
                    .join(" · ") + (funded.length > 3 ? ` · +${funded.length - 3}` : "")
                : `No balance · ${scannedChains} networks checked`}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className={`block text-[12px] font-semibold num ${hasBalance ? "" : "text-muted-foreground/50"}`}>
            {invalid ? "—" : formatUsd(result.total)}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !invalid ? (
        <div className="border-t border-foreground/[0.06] px-3.5 py-3">
          {funded.length > 0 ? (
            <ul className="space-y-2">
              {funded.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5">
                  <CoinAvatar symbol={item.symbol} color={item.color} logo={item.logo} size="sm" />
                  <span className="flex-1 truncate text-[11px]">
                    <span className="font-medium">{item.symbol}</span>
                    {/* ETH lives on many networks, so the network is named here. */}
                    <span className="ml-1.5 text-[9px] uppercase tracking-[0.08em] text-muted-foreground/50">
                      {item.chain}
                    </span>
                    <span className="ml-1.5 text-muted-foreground/70 num">{compactAmount(item.balance)}</span>
                  </span>
                  <span className="text-[11px] font-medium num">{formatUsd(item.value)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10.5px] text-muted-foreground/70">
              Nothing found on the scanned assets
              {result.failed
                ? ` · ${result.failed} chain read${result.failed === 1 ? "" : "s"} failed${
                    result.failedChains?.length ? ` (${result.failedChains.slice(0, 4).join(", ")})` : ""
                  }`
                : ""}
              .
            </p>
          )}

          {funded.length > 0 && result.failed ? (
            <p className="mt-2 text-[10px] text-muted-foreground/60">
              {result.failed} chain read{result.failed === 1 ? "" : "s"} failed
              {result.failedChains?.length ? ` (${result.failedChains.slice(0, 4).join(", ")})` : ""} — open the
              address on a block explorer to be sure.
            </p>
          ) : null}

          <div className="mt-3 space-y-1.5 border-t border-foreground/[0.06] pt-2.5">
            {addressRows.map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className="w-[86px] shrink-0 text-[8.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground/55">
                  {row.label}
                </span>
                <span className="flex-1 truncate font-mono text-[10px] text-muted-foreground">{shortAddress(row.value)}</span>
                <button
                  type="button"
                  onClick={() => copy(row.value)}
                  aria-label={`Copy ${row.label} address`}
                  className="shrink-0 rounded-md p-1 text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  {copied === row.value ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}