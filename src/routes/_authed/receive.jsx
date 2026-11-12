import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import AddressCard from "@/components/receive/AddressCard";
import NetworkAssets from "@/components/receive/NetworkAssets";
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
  const { wallet, account } = useWallet();
  const [coinId, setCoinId] = useState(search.coin || "bitcoin");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const addresses = useMemo(
    () => getAddresses(wallet?.mnemonic || "", account),
    [wallet?.mnemonic, account],
  );
  const coin = assets.find((item) => item.id === coinId) || assets[0];
  const address = addresses[coin.chain] || "";

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matched = term
      ? assets.filter(
          (item) =>
            item.symbol.toLowerCase().includes(term) ||
            item.name.toLowerCase().includes(term) ||
            (chains[item.chain]?.name || "").toLowerCase().includes(term),
        )
      : assets;

    const order = Object.keys(chains);
    const byChain = new Map();
    for (const item of matched) {
      if (!byChain.has(item.chain)) byChain.set(item.chain, []);
      byChain.get(item.chain).push(item);
    }
    return [...byChain.entries()]
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([chain, items]) => ({ chain, items }));
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

      <AddressCard coin={coin} address={address} copied={copied} onCopy={copy} onShare={share} />

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search asset or network"
          className="w-full rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] py-2 pl-9 pr-3 text-[12px] outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-primary/40"
        />
      </div>

      <div className="mt-4">
        <NetworkAssets groups={groups} selectedId={coin.id} onSelect={setCoinId} />
      </div>

      <p className="mt-6 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/40">
        Addresses derived on this device · never uploaded
      </p>
    </div>
  );
}