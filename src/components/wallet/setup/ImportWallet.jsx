import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PasswordForm from "./PasswordForm";
import { validateMnemonic } from "@/lib/bip39";
import { useWallet } from "@/lib/WalletContext";

export default function ImportWallet({ onCancel }) {
  const { create } = useWallet();
  const [step, setStep] = useState("phrase");
  const [phrase, setPhrase] = useState("");
  const [wordCount, setWordCount] = useState(12);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function checkPhrase(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await validateMnemonic(phrase);
      if (!result.valid) {
        setError(result.reason);
        return;
      }
      setPhrase(phrase.trim().toLowerCase().split(/\s+/).join(" "));
      setWordCount(result.wordCount);
      setStep("password");
    } finally {
      setBusy(false);
    }
  }

  async function finish(password) {
    setBusy(true);
    setError("");
    try {
      await create({ mnemonic: phrase, wordCount, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "password") {
    return <PasswordForm submitLabel="Restore wallet" onSubmit={finish} busy={busy} error={error} />;
  }

  return (
    <form onSubmit={checkPhrase}>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </button>
      <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight">Restore from a phrase</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        Enter your 12 or 24 words separated by spaces. Typing it here keeps it on this device only.
      </p>
      <Textarea
        value={phrase}
        onChange={(event) => setPhrase(event.target.value)}
        rows={4}
        spellCheck={false}
        autoCapitalize="none"
        placeholder="word one two three …"
        className="mt-4 resize-none bg-secondary/40 font-mono text-[13px] leading-relaxed"
      />
      {error && <p className="mt-3 text-[12px] text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || !phrase.trim()} className="mt-5 w-full rounded-xl">
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue
      </Button>
    </form>
  );
}