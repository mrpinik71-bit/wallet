import { useState } from "react";
import { KeyRound, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/lib/WalletContext";
import { readVaultMeta } from "@/lib/vault";

export default function UnlockVault() {
  const { unlock, erase } = useWallet();
  const [meta] = useState(() => readVaultMeta());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await unlock(password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="panel p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 ring-1 ring-inset ring-primary/25">
          <KeyRound className="h-4.5 w-4.5 text-primary" />
        </span>
        <h1 className="mt-4 font-heading text-xl font-semibold tracking-tight">Unlock your wallet</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {meta
            ? `A ${meta.wordCount}-word wallet is stored on this device.`
            : "A wallet is stored on this device."}
        </p>

        <form onSubmit={submit} className="mt-5">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Wallet password"
            autoComplete="current-password"
            className="bg-secondary/40"
          />
          {error && <p className="mt-3 text-[12px] text-destructive">{error}</p>}
          <Button type="submit" disabled={busy || !password} className="mt-4 w-full rounded-xl">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unlock
          </Button>
        </form>

        <button
          type="button"
          onClick={erase}
          className="mt-5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Forget this wallet on this device
        </button>
      </div>
    </div>
  );
}