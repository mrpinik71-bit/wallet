import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import { readVaultMeta } from "@/lib/vault";
import BrandMark from "@/components/wallet/BrandMark";
import VaultBackdrop from "@/components/wallet/VaultBackdrop";
import VaultEmblem from "@/components/wallet/setup/unlock/VaultEmblem";
import PinCells from "@/components/wallet/setup/unlock/PinCells";
import PinKeypad from "@/components/wallet/setup/unlock/PinKeypad";
import PhraseCheckScreen from "@/components/wallet/scan/PhraseCheckScreen";
import EntryAssistant from "@/components/wallet/home/EntryAssistant";

const rise = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

export default function UnlockVault() {
  const { unlock, erase } = useWallet();
  const [meta] = useState(() => readVaultMeta());
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checker, setChecker] = useState(false);

  async function attempt(value) {
    setBusy(true);
    setError("");
    try {
      await unlock(value);
    } catch (err) {
      setError(err.message);
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  function enter(digit) {
    if (busy || pin.length >= 4) return;
    const next = `${pin}${digit}`;
    setPin(next);
    setError("");
    if (next.length === 4) attempt(next);
  }

  function removeDigit() {
    if (busy) return;
    setPin(pin.slice(0, -1));
    setError("");
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (checker) return;
      if (/^\d$/.test(event.key)) enter(event.key);
      else if (event.key === "Backspace") removeDigit();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (checker) {
    return <PhraseCheckScreen onClose={() => setChecker(false)} />;
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <VaultBackdrop />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[404px] flex-col px-5 pb-7 pt-8">
        <header className="flex items-center justify-between">
          <BrandMark />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.09] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
            <ShieldCheck className="h-2.5 w-2.5 text-primary" strokeWidth={2.4} />
            Secure
          </span>
        </header>

        <motion.div {...rise} transition={{ duration: 0.55, ease: "easeOut" }} className="mt-8">
          <div className="lux noise overflow-hidden px-5 pb-6 pt-7">
            <div
              aria-hidden="true"
              className="glow-mint pointer-events-none absolute -top-24 left-1/2 h-56 w-72 -translate-x-1/2 opacity-70"
            />
            <div className="relative">
              <div className="text-center">
                <VaultEmblem busy={busy} />
                <p className="mt-6 text-[9px] font-medium uppercase tracking-[0.34em] text-primary/70">
                  Secure access
                </p>
                <h1 className="mt-2.5 font-display text-[40px] leading-[1.03] tracking-[-0.015em]">
                  Welcome back
                </h1>
                <p className="mx-auto mt-2.5 max-w-[248px] text-[11.5px] leading-relaxed text-muted-foreground">
                  Enter your 4-digit PIN to unlock the vault stored on this device.
                </p>
              </div>

              <div className="mt-7">
                <PinCells length={pin.length} error={Boolean(error)} />
              </div>

              <div className="mt-4 flex h-5 items-center justify-center gap-1.5 px-2">
                {error ? (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" strokeWidth={2} />
                    <p className="text-[11.5px] font-medium leading-tight text-destructive">{error}</p>
                  </>
                ) : (
                  <p className="text-[10.5px] tracking-wide text-muted-foreground/70">
                    {busy ? "Decrypting your vault…" : "Your PIN never leaves this device"}
                  </p>
                )}
              </div>

              <div className="mx-auto mt-5 max-w-[292px]">
                <PinKeypad onDigit={enter} onDelete={removeDigit} disabled={busy} canDelete={pin.length > 0} />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-4">
          <EntryAssistant />
        </div>

        <div className="mt-auto pt-7 text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] tracking-wide text-muted-foreground/60">
            <span>{meta ? `${meta.wordCount}-word phrase` : "Recovery phrase"}</span>
            <span className="h-1 w-1 rounded-full bg-foreground/20" />
            <span>AES-256</span>
            <span className="h-1 w-1 rounded-full bg-foreground/20" />
            <span>On-device</span>
          </div>
          <button
            type="button"
            onClick={() => setChecker(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground/80 underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground"
          >
            <Search className="h-3 w-3" strokeWidth={1.8} />
            Phrase checker
          </button>
          <div className="h-2" aria-hidden="true" />
          <button
            type="button"
            onClick={erase}
            className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground/80 underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" strokeWidth={1.8} />
            Restore from recovery phrase
          </button>
        </div>
      </div>
    </div>
  );
}