import { useState } from "react";
import { KeyRound, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/lib/WalletContext";
import { readVaultMeta } from "@/lib/vault";

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

  function submit(event) {
    event.preventDefault();
    if (pin.length === 4) attempt(pin);
  }

  function change(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    if (digits.length === 4) attempt(digits);
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="panel p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 ring-1 ring-inset ring-primary/25">
          <KeyRound className="h-4 w-4 text-primary" />
        </span>
        <h1 className="mt-4 font-heading text-xl font-semibold tracking-tight">Enter your PIN</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {meta
            ? `A ${meta.wordCount}-word wallet is stored on this device.`
            : "A wallet is stored on this device."}{" "}
          Enter the 4-digit PIN you chose to unlock it.
        </p>

        <form onSubmit={submit} className="mt-5">
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={4}
            value={pin}
            onChange={(event) => change(event.target.value)}
            placeholder="••••"
            autoFocus
            className="bg-secondary/40 text-center font-mono text-2xl tracking-[0.8em]"
          />
          {error && <p className="mt-3 text-[12px] text-destructive">{error}</p>}
          <Button type="submit" disabled={busy || pin.length !== 4} className="mt-4 w-full rounded-xl">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unlock
          </Button>
        </form>

        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          Forgot your PIN? It cannot be reset — only your recovery phrase can restore this wallet.
        </p>
        <button
          type="button"
          onClick={erase}
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Forget this wallet and restore with a phrase
        </button>
      </div>
    </div>
  );
}