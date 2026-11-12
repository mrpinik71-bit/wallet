import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Check, QrCode as QrIcon } from "lucide-react";
import PageHeader from "@/components/wallet/PageHeader";
import CoinAvatar from "@/components/wallet/CoinAvatar";
import QrCode from "@/components/wallet/QrCode";
import NoticeBanner from "@/components/wallet/NoticeBanner";
import { assets } from "@/lib/sample-wallet";

export const Route = createFileRoute("/_authed/receive")({
  head: () => ({
    meta: [
      { title: "Receive — Helix" },
      { name: "description", content: "Share your address or QR code to receive crypto safely." },
    ],
  }),
  component: Receive,
});

function Receive() {
  const [assetId, setAssetId] = useState("eth");
  const [copied, setCopied] = useState(false);
  const asset = assets.find((item) => item.id === assetId);
  const address = "";

  async function copy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <PageHeader
        eyebrow="Deposit"
        title="Receive"
        description="Only send the matching asset on the matching network to this address."
      />

      <NoticeBanner title="Addresses appear once a network is linked">
        Your wallet keys are already created and encrypted on this device. Chain addresses are derived
        at the moment a live network is connected, so nothing can be sent to this wallet yet.
      </NoticeBanner>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="panel p-5">
          <p className="eyebrow">Choose asset</p>
          <div className="mt-3 grid gap-2">
            {assets.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAssetId(item.id)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  assetId === item.id
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/70 bg-secondary/20 hover:border-border"
                }`}
              >
                <CoinAvatar symbol={item.symbol} color={item.color} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.chain}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel flex flex-col items-center justify-center p-8 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <QrIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-heading text-base font-semibold tracking-tight">
            {asset.symbol} address not generated
          </h2>
          <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted-foreground">
            This wallet has no {asset.chain} address yet. Open Wallet security to create or unlock your
            keys — your QR code and address will appear here as soon as a network is connected.
          </p>

          {address && (
            <>
              <div className="mt-5">
                <QrCode value={address} />
              </div>
              <button
                type="button"
                onClick={copy}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 font-mono text-[12px] transition-colors hover:border-primary/40"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                {address}
              </button>
            </>
          )}
        </section>
      </div>
    </>
  );
}