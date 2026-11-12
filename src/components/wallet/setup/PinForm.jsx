import { useEffect, useState } from "react";
import { AlertCircle, LockKeyhole, Loader2 } from "lucide-react";
import PinCells from "./unlock/PinCells";
import PinKeypad from "./unlock/PinKeypad";

export default function PinForm({ submitLabel, onSubmit, busy, error }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phase, setPhase] = useState("pin");
  const [localError, setLocalError] = useState("");

  const value = phase === "pin" ? pin : confirm;
  const ready = pin.length === 4 && confirm.length === 4;
  const shown = localError || error;

  function enter(digit) {
    if (busy) return;
    setLocalError("");
    if (phase === "pin") {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) setPhase("confirm");
      return;
    }
    const next = confirm + digit;
    setConfirm(next);
    if (next.length === 4 && next !== pin) {
      setConfirm("");
      setLocalError("Those PINs don't match. Try again.");
    }
  }

  function removeDigit() {
    if (busy) return;
    setLocalError("");
    if (phase === "confirm") {
      if (confirm.length === 0) {
        setPhase("pin");
        setPin(pin.slice(0, -1));
        return;
      }
      setConfirm(confirm.slice(0, -1));
      return;
    }
    setPin(pin.slice(0, -1));
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
    <div>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-inset ring-primary/25">
        <LockKeyhole className="h-4 w-4 text-primary" strokeWidth={1.7} />
      </span>
      <h2 className="mt-4 font-heading text-xl font-semibold tracking-tight">Set a 4-digit PIN</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        Your recovery phrase is encrypted with this PIN (AES-256) and kept only on this device. You will
        enter it every time you open the wallet.
      </p>

      <p className="mt-6 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {phase === "pin" ? "Choose your PIN" : "Confirm your PIN"}
      </p>

      <div className="mt-3">
        <PinCells length={value.length} error={Boolean(shown)} />
      </div>

      <div className="mt-3 flex h-5 items-center justify-center gap-1.5 px-2">
        {shown ? (
          <>
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" strokeWidth={2} />
            <p className="text-[12px] font-medium text-destructive">{shown}</p>
          </>
        ) : (
          <p className="text-[11px] text-muted-foreground/70">
            {phase === "confirm" ? "Enter the same 4 digits again" : "Tap the keypad below"}
          </p>
        )}
      </div>

      <div className="mx-auto mt-4 max-w-[302px]">
        <PinKeypad onDigit={enter} onDelete={removeDigit} disabled={busy} canDelete={value.length > 0} />
      </div>

      <button
        type="button"
        onClick={() => onSubmit(pin)}
        disabled={busy || !ready}
        className="mx-auto mt-5 flex h-11 w-full max-w-[302px] items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}