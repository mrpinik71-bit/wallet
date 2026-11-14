import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/wallet/PageHeader";
import QrScanner from "@/components/wallet/QrScanner";
import TokenPicker from "@/components/send/TokenPicker";
import SendForm from "@/components/send/SendForm";
import ConfirmStep from "@/components/send/ConfirmStep";
import SentStep from "@/components/send/SentStep";
import { useWallet } from "@/lib/WalletContext";
import usePortfolio from "@/hooks/usePortfolio";
import { openVault } from "@/lib/vault";
import { estimateFee, sendAsset, validateAddress } from "@/lib/chains/send";
import { coinById } from "@/lib/chains/config";

export const Route = createFileRoute("/_authed/send")({
  validateSearch: (search) => ({
    coin: typeof search.coin === "string" ? search.coin : undefined,
    scan: typeof search.scan === "string" ? search.scan : undefined,
    to: typeof search.to === "string" ? search.to : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Send — Helix" },
      { name: "description", content: "Send crypto on-chain with a QR scanner, fee preview and PIN confirmation." },
    ],
  }),
  component: Send,
});

function extractAddress(raw) {
  let value = String(raw || "").trim();
  const scheme = value.match(/^[a-z][a-z0-9+.-]*:/i);
  if (scheme) value = value.slice(scheme[0].length);
  return value.split("?")[0].replace(/^\/\//, "").trim();
}

function Send() {
  const search = Route.useSearch();
  const { wallet, account } = useWallet();
  const { holdings, loading, refresh } = usePortfolio();

  const [step, setStep] = useState("select");
  const [coinId, setCoinId] = useState(search.coin || null);
  // An address handed over by the assistant is already in the form.
  const [to, setTo] = useState(search.to || "");
  const [amount, setAmount] = useState("");
  const [scanning, setScanning] = useState(Boolean(search.scan));
  const [fee, setFee] = useState(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pinError, setPinError] = useState("");
  const [hash, setHash] = useState("");

  const coin = useMemo(
    () => holdings.find((item) => item.id === coinId) || coinById(coinId) || null,
    [holdings, coinId],
  );

  const nativeCoin = useMemo(() => {
    if (!coin) return null;
    if (coin.kind === "native") return coin;
    return (
      holdings.find((item) => item.kind === "native" && item.chain === coin.chain) ||
      holdings.find((item) => item.symbol === "ETH")
    );
  }, [coin, holdings]);

  useEffect(() => {
    if (!loading && coinId && step === "select") setStep("form");
  }, [loading, coinId, step]);

  useEffect(() => {
    if (!coin || step !== "form" || !to || !(Number(amount) > 0) || validateAddress(coin, to)) {
      setFee(null);
      return undefined;
    }
    let active = true;
    setFeeLoading(true);
    const timer = setTimeout(async () => {
      try {
        const value = await estimateFee({ coin, mnemonic: wallet.mnemonic, to, amount, account });
        if (active) setFee(value);
      } catch {
        if (active) setFee(null);
      } finally {
        if (active) setFeeLoading(false);
      }
    }, 450);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [coin, to, amount, step, wallet?.mnemonic, account]);

  function pick(item) {
    setCoinId(item.id);
    setStep("form");
    setError("");
    setFee(null);
  }

  function scanResult(raw) {
    setScanning(false);
    setTo(extractAddress(raw));
    if (!coin) {
      const fallback = holdings.find((item) => item.balance > 0) || holdings[0];
      if (fallback) {
        setCoinId(fallback.id);
        setStep("form");
      }
    }
  }

  function useMax() {
    if (!coin) return;
    const reserve = coin.kind === "native" && fee ? fee : 0;
    const max = Math.max(0, coin.balance - reserve);
    setAmount(max ? String(Number(max.toFixed(8))) : "0");
  }

  function goConfirm() {
    if (!coin) return;
    const invalid = validateAddress(coin, to);
    if (invalid) return setError(invalid);
    const value = Number(amount);
    if (!(value > 0)) return setError("Enter an amount greater than zero.");
    if (value > coin.balance) return setError("Amount is larger than your available balance.");
    if (coin.kind === "native" && fee != null && value + fee > coin.balance) {
      return setError("Leave room for the network fee.");
    }
    setError("");
    setPinError("");
    setStep("confirm");
  }

  async function handleConfirm(pin) {
    setPinError("");
    setBusy(true);
    try {
      const opened = await openVault(pin);
      const txHash = await sendAsset({ coin, mnemonic: opened.mnemonic, to, amount, account });
      setHash(txHash);
      setStep("sent");
      refresh();
    } catch (cause) {
      setPinError(cause?.message || "The transfer could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const feeUsd = fee != null && nativeCoin ? fee * nativeCoin.price : 0;

  return (
    <div className="mx-auto w-full max-w-[460px]">
      <PageHeader
        eyebrow="Transfer"
        title="Send"
        description="Balances are read live from the chain and every transfer is signed on this device."
      />

      {step === "select" && (
        <>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Pick the asset you want to move. Balances are live from the chain.
          </p>
          <TokenPicker holdings={holdings} loading={loading} onSelect={pick} />
        </>
      )}

      {step === "form" && coin && (
        <SendForm
          coin={coin}
          to={to}
          onTo={setTo}
          amount={amount}
          onAmount={setAmount}
          fee={fee}
          feeLoading={feeLoading}
          onScan={() => setScanning(true)}
          onBack={() => {
            setStep("select");
            setCoinId(null);
            setError("");
          }}
          onContinue={goConfirm}
          onMax={useMax}
          error={error}
          busy={false}
        />
      )}

      {step === "confirm" && coin && (
        <ConfirmStep
          coin={coin}
          to={to}
          amount={amount}
          fee={fee}
          feeUsd={feeUsd}
          onBack={() => {
            setStep("form");
            setPinError("");
          }}
          onConfirm={handleConfirm}
          busy={busy}
          error={pinError}
        />
      )}

      {step === "sent" && coin && (
        <SentStep coin={coin} amount={amount} hash={hash} onDone={() => setStep("select")} />
      )}

      <QrScanner open={scanning} onClose={() => setScanning(false)} onResult={scanResult} />
    </div>
  );
}