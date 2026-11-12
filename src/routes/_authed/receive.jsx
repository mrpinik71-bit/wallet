import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Search, Share2 } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import QrCode from "@/components/wallet/QrCode";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import { useWallet } from "@/lib/WalletContext";
import { assets, chains } from "@/lib/chains/config";
import { getAddresses } from "@/lib/chains/derive";

export const Route = createFileRoute("/_authed/receive")({
  validateSearch: (search) => ({
    coin: typeof search.coin === "string" ? search.coin : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Receive — Helix" },
      { name: "description", content: "Your deposit address and QR code for every supported network." },
    ],
  }),
  component: Receive,
});

function Receive() {
  const search = Route.useSearch();
  const { wallet } = useWallet();
  const [coinId, setCoinId] = useState(search.coin || "bitcoin");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const addresses = useMemo(() => getAddresses(wallet?.mnemonic || ""), [wallet?.mnemonic]);
  const coin = assets.find((item) => item.id === coinId) || assets[0];
  const address = addresses[coin.chain] || "";

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter(
      (item) =>
        item.symbol.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        (chains[item.chain]?.name || "").toLowerCase().includes(term),
    );
  }, [query]);

  async function copy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function share() {
    if (!address) return;
    if (navigator.share) {
      await navigator.share({ title: `${coin.symbol} address`, text: address }).catch(() => {});
      return;
    }
    copy();
  }

  return (
    <div className="mx-auto w-full max-w-[460px]">
      <PageHeader eyebrow="Deposit" title="Receive" />

      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/25 p-3">
        <CoinAvatar symbol={coin.symbol} color={coin.color} logo={coin.logo} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{coin.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {chains[coin.chain]?.name} · {coin.symbol}
          </p>
        </div>
        <button
          type="button"
          onClick={share}
          aria-label="Share address"
          className="grid h-9 w-9 place-items-center rounded-full border border-border/70 text-muted-foreground"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 flex flex-col items-center rounded-3xl border border-border/70 bg-card p-5">
        <QrCode value={address} size={208} />
        <p className="mt-4 break-all text-center font-mono text-[12px] leading-relaxed">{address || "Generating address…"}</p>
        <button
          type="button"
          onClick={copy}
          disabled={!address}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-action px-4 py-2.5 text-[12px] font-semibold text-action-foreground disabled:opacity-60"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy address"}
        </button>
        <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
          Only send {coin.symbol} on {chains[coin.chain]?.name} to this address. Assets sent on another network are lost.
        </p>
      </div>

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search asset"
          className="w-full rounded-xl border border-border/70 bg-secondary/25 py-2 pl-9 pr-3 text-[12px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {matches.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCoinId(item.id)}
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
              coin.id === item.id
                ? "border-primary/40 bg-primary/10"
                : "border-border/70 bg-secondary/20 hover:border-border"
            }`}
          >
            <CoinAvatar symbol={item.symbol} color={item.color} logo={item.logo} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium">{item.symbol}</p>
              <p className="truncate text-[9px] text-muted-foreground">{chains[item.chain]?.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}