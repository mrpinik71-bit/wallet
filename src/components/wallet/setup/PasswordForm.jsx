import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordForm({ submitLabel, onSubmit, busy, error }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (password.length < 8) {
      setLocalError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setLocalError("The two passwords do not match.");
      return;
    }
    setLocalError("");
    onSubmit(password);
  }

  return (
    <form onSubmit={handleSubmit}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-inset ring-primary/25">
        <Lock className="h-4 w-4 text-primary" />
      </span>
      <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight">Protect this device</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        Your recovery phrase is encrypted with this password using AES-256 before it is stored locally.
        There is no password reset — without it the phrase cannot be unlocked.
      </p>

      <div className="mt-5 grid gap-3">
        <div>
          <Label htmlFor="vault-password" className="text-[11px] text-muted-foreground">
            Password
          </Label>
          <Input
            id="vault-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            className="mt-1.5 bg-secondary/40"
          />
        </div>
        <div>
          <Label htmlFor="vault-confirm" className="text-[11px] text-muted-foreground">
            Confirm password
          </Label>
          <Input
            id="vault-confirm"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            className="mt-1.5 bg-secondary/40"
          />
        </div>
      </div>

      {(localError || error) && <p className="mt-3 text-[12px] text-destructive">{localError || error}</p>}

      <Button type="submit" disabled={busy} className="mt-5 w-full rounded-xl">
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}