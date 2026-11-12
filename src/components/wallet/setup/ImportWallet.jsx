import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PinForm from "./PinForm";
import SetupStepHeader from "./SetupStepHeader";
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
      setStep("pin");
    } finally {
      setBusy(false);
    }
  }

  async function finish(pin) {
    setBusy(true);
    setError("");
    try {
      await create({ mnemonic: phrase, wordCount, pin });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "pin") {
    return (
      <PinForm
        submitLabel="Restore wallet"
        onSubmit={finish}
        busy={busy}
        error={error}
        onBack={() => setStep("phrase")}
        total={2}
        backLabel="Phrase"
      />
    );
  }

  return (
    <form onSubmit={checkPhrase}>
      <SetupStepHeader
        step={1}
        total={2}
        title="Restore a wallet"
        description="Enter your 12 or 24 words separated by spaces. Typing it here keeps it on this device only."
        onBack={onCancel}
      />

      <Textarea
        value={phrase}
        onChange={(event) => setPhrase(event.target.value)}
        rows={4}
        spellCheck={false}
        autoCapitalize="none"
        placeholder="word one two three …"
        className="mt-5 resize-none rounded-2xl border-foreground/[0.08] bg-foreground/[0.025] font-mono text-[12.5px] leading-relaxed focus-visible:border-primary/40 focus-visible:ring-0"
      />

      {error && <p className="mt-3 text-[11.5px] text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={busy || !phrase.trim()}
        className="mt-5 h-11 w-full rounded-xl text-[12.5px] font-semibold shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.9)]"
      >
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue
      </Button>
    </form>
  );
}