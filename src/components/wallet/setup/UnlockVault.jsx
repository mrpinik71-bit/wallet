import { useEffect, useState } from "react";
import { Delete, Loader2, LockKeyhole, ShieldCheck, Trash2 } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import { readVaultMeta } from "@/lib/vault";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "blank", "0", "delete"];

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
      <div aria-hidden="true" className="glow-mint pointer-events-none absolute inset-x-0 -top-24 h-72" />

      <header className="relative flex items-center justify-between px-6 pt-8">
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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-primary" strokeWidth={2} />
          Encrypted
        </span>
      </header>

      <main className="relative mx-auto flex w-full max-w-sm flex-col px-6 pb-10 pt-10">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-border/70 bg-card/80 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)]">
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <LockKeyhole className="h-6 w-6 text-primary" strokeWidth={1.7} />
            )}
          </span>
          <h1 className="mt-5 font-heading text-[26px] font-semibold tracking-[-0.01em]">Welcome back</h1>
          <p className="mx-auto mt-2 max-w-[268px] text-[12.5px] leading-relaxed text-muted-foreground">
            Enter your 4-digit PIN to unlock the wallet stored on this device.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
            {meta ? `${meta.wordCount}-word phrase` : "Recovery phrase"}
            <span className="opacity-40">·</span>
            PIN protected
          </span>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3.5">
          {[0, 1, 2, 3].map((index) => {
            const filled = index < pin.length;
            return (
              <span
                key={index}
                className={`h-3.5 w-3.5 rounded-full border transition-all duration-150 ${
                  error
                    ? "border-destructive/60 bg-destructive/25"
                    : filled
                      ? "border-primary bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.45)]"
                      : "border-border bg-transparent"
                }`}
              />
            );
          })}
        </div>

        <div className="mt-4 h-5 text-center">
          {error ? (
            <p className="text-[12px] font-medium text-destructive">{error}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground/70">{busy ? "Unlocking your wallet…" : "PIN is stored only on this device"}</p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {KEYS.map((key) => {
            if (key === "blank") return <span key="blank" />;
            if (key === "delete") {
              return (
                <button
                  key="delete"
                  type="button"
                  onClick={removeDigit}
                  disabled={busy || pin.length === 0}
                  aria-label="Delete last digit"
                  className="grid h-14 place-items-center rounded-2xl text-muted-foreground transition-colors hover:text-foreground active:scale-[0.97] disabled:opacity-40"
                >
                  <Delete className="h-5 w-5" strokeWidth={1.8} />
                </button>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => enter(key)}
                disabled={busy}
                className="grid h-14 place-items-center rounded-2xl border border-border/60 bg-secondary/40 font-heading text-[19px] font-medium tabular transition-colors hover:border-border hover:bg-secondary/70 active:scale-[0.97] disabled:opacity-50"
              >
                {key}
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Forgot your PIN? It can't be reset — only your recovery phrase can restore this wallet.
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
      </main>
    </div>
  );
}