import { useState } from "react";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeedGrid from "./SeedGrid";
import SeedVerify from "./SeedVerify";
import PasswordForm from "./PasswordForm";
import { generateMnemonic } from "@/lib/bip39";
import { useWallet } from "@/lib/WalletContext";

export default function CreateWallet({ onCancel }) {
  const { create } = useWallet();
  const [step, setStep] = useState("choose");
  const [wordCount, setWordCount] = useState(12);
  const [mnemonic, setMnemonic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start(count) {
    setBusy(true);
    try {
      const phrase = await generateMnemonic(count);
      setWordCount(count);
      setMnemonic(phrase);
      setStep("phrase");
    } finally {
      setBusy(false);
    }
  }

  async function finish(password) {
    setBusy(true);
    setError("");
    try {
      await create({ mnemonic, wordCount, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "choose") {
    return (
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <h2 className="mt-4 font-heading text-xl font-semibold tracking-tight">Create a new wallet</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Pick how long your recovery phrase should be. Both are generated on this device with your
          browser&apos;s secure random generator.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { count: 12, title: "12 words", blurb: "128-bit entropy — the everyday choice for most wallets." },
            { count: 24, title: "24 words", blurb: "256-bit entropy — the strongest option available." },
          ].map((option) => (
            <button
              key={option.count}
              type="button"
              onClick={() => start(option.count)}
              disabled={busy}
              className="group rounded-2xl border border-border/70 bg-secondary/25 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/50 disabled:opacity-60"
            >
              <p className="font-heading text-sm font-semibold">{option.title}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{option.blurb}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-primary">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Generate phrase
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "phrase") {
    return (
      <div>
        <p className="eyebrow">Step 1 of 3</p>
        <h2 className="mt-2 font-heading text-lg font-semibold tracking-tight">Write this down</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          This is the only key to your wallet. Store it offline — never share it, never type it into a
          website, and never send it to anyone.
        </p>
        <div className="mt-4">
          <SeedGrid mnemonic={mnemonic} />
        </div>
        <div className="mt-4 flex gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Anyone with these words controls your funds. Helix cannot recover them for you.
          </p>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <Button onClick={() => setStep("verify")} className="flex-1 rounded-xl">
            I&apos;ve written it down
          </Button>
          <Button variant="ghost" onClick={() => setStep("choose")} className="rounded-xl">
            Start over
          </Button>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return <SeedVerify mnemonic={mnemonic} onVerified={() => setStep("password")} onBack={() => setStep("phrase")} />;
  }

  return <PasswordForm submitLabel="Create wallet" onSubmit={finish} busy={busy} error={error} />;
}