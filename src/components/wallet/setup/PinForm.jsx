import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const digitsOnly = (value) => value.replace(/\D/g, "").slice(0, 4);

export default function PinForm({ submitLabel, onSubmit, busy, error }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (pin.length !== 4) {
      setLocalError("Your PIN must be exactly 4 digits.");
      return;
    }
    if (pin !== confirm) {
      setLocalError("The two PINs do not match.");
      return;
    }
    setLocalError("");
    onSubmit(pin);
  }

  return (
    <form onSubmit={handleSubmit}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-inset ring-primary/25">
        <LockKeyhole className="h-4 w-4 text-primary" />
      </span>
      <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight">Set a 4-digit PIN</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        Your recovery phrase is encrypted with this PIN (AES-256) and kept only on this device. You will
        enter it every time you open the wallet.
      </p>

      <div className="mt-5 grid gap-3">
        <div>
          <Label htmlFor="vault-pin" className="text-[11px] text-muted-foreground">
            PIN
          </Label>
          <Input
            id="vault-pin"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={4}
            value={pin}
            onChange={(event) => setPin(digitsOnly(event.target.value))}
            placeholder="••••"
            className="mt-1.5 bg-secondary/40 text-center font-mono text-xl tracking-[0.6em]"
          />
        </div>
        <div>
          <Label htmlFor="vault-pin-confirm" className="text-[11px] text-muted-foreground">
            Confirm PIN
          </Label>
          <Input
            id="vault-pin-confirm"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={4}
            value={confirm}
            onChange={(event) => setConfirm(digitsOnly(event.target.value))}
            placeholder="••••"
            className="mt-1.5 bg-secondary/40 text-center font-mono text-xl tracking-[0.6em]"
          />
        </div>
      </div>

      {(localError || error) && <p className="mt-3 text-[12px] text-destructive">{localError || error}</p>}

      <Button
        type="submit"
        disabled={busy || pin.length !== 4 || confirm.length !== 4}
        className="mt-5 w-full rounded-xl"
      >
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}