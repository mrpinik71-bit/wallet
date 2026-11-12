import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ShieldCheck, Trash2 } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import { readVaultMeta } from "@/lib/vault";
import UnlockBackdrop from "@/components/wallet/setup/unlock/UnlockBackdrop";
import VaultEmblem from "@/components/wallet/setup/unlock/VaultEmblem";
import PinCells from "@/components/wallet/setup/unlock/PinCells";
import PinKeypad from "@/components/wallet/setup/unlock/PinKeypad";

const rise = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function UnlockVault() {
  const { unlock, erase } = useWallet();
  const [meta] = useState(() => readVaultMeta());
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      if (/^\d$/.test(event.key)) enter(event.key);
      else if (event.key === "Backspace") removeDigit();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <UnlockBackdrop />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6 pb-7 pt-7">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 ring-1 ring-inset ring-primary/30">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary" fill="none" aria-hidden="true">
                <path d="M8 3.5c0 4.5 8 4.5 8 9s-8 4.5-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M16 3.5c0 4.5-8 4.5-8 9s8 4.5 8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.45" />
              </svg>
            </span>
            <div className="leading-none">
              <p className="font-heading text-[15px] font-semibold tracking-tight">Helix</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Self-custody</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur">
            <ShieldCheck className="h-3 w-3 text-primary" strokeWidth={2} />
            Encrypted
          </span>
        </header>

        <motion.div {...rise} transition={{ duration: 0.5, ease: "easeOut" }} className="mt-9 text-center">
          <VaultEmblem busy={busy} />
          <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.28em] text-primary/80">Vault locked</p>
          <h1 className="mt-2.5 font-display text-[37px] leading-[1.04] tracking-[-0.01em] text-foreground">
            Welcome back
          </h1>
          <p className="mx-auto mt-2.5 max-w-[262px] text-[12.5px] leading-relaxed text-muted-foreground">
            Enter your 4-digit PIN to open the wallet stored on this device.
          </p>
        </motion.div>

        <motion.div {...rise} transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}>
          <div className="mt-8">
            <PinCells length={pin.length} error={Boolean(error)} />
          </div>
          <div className="mt-4 flex h-5 items-center justify-center gap-1.5 px-2">
            {error ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" strokeWidth={2} />
                <p className="text-[12px] font-medium leading-tight text-destructive">{error}</p>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground/70">
                {busy ? "Decrypting your vault…" : "Your PIN never leaves this device"}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div {...rise} transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }} className="mt-5">
          <PinKeypad onDigit={enter} onDelete={removeDigit} disabled={busy} canDelete={pin.length > 0} />
        </motion.div>

        <div className="mt-auto pt-7 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground backdrop-blur">
            {meta ? `${meta.wordCount}-word phrase` : "Recovery phrase"}
            <span className="opacity-40">·</span>
            AES-256 encrypted
          </span>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Forgot your PIN? It can't be reset.
          </p>
          <button
            type="button"
            onClick={erase}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            Restore with recovery phrase
          </button>
        </div>
      </div>
    </div>
  );
}