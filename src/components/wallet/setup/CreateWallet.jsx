import { useState } from "react";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeedGrid from "./SeedGrid";
import SeedVerify from "./SeedVerify";
import PinForm from "./PinForm";
import SetupStepHeader from "./SetupStepHeader";
import { generateMnemonic } from "@/lib/bip39";
import { useWallet } from "@/lib/WalletContext";

const options = [
  { count: 12, title: "12 words", blurb: "128-bit entropy — the everyday choice for most wallets." },
  { count: 24, title: "24 words", blurb: "256-bit entropy — the strongest option available." },
];

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

  async function finish(pin) {
    setBusy(true);
    setError("");
    try {
      await create({ mnemonic, wordCount, pin });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "choose") {
    return (
      <div>
        <SetupStepHeader
          title="Create a new wallet"
          description="Pick how long your recovery phrase should be. Both are generated on this device with your browser's secure random generator."
          onBack={onCancel}
        />

        <div className="mt-5 space-y-2">
          {options.map((option) => (
            <button
              key={option.count}
              type="button"
              onClick={() => start(option.count)}
              disabled={busy}
              className="group flex w-full items-center gap-3.5 rounded-2xl border border-foreground/[0.07] bg-foreground/[0.025] px-4 py-3.5 text-left transition-colors hover:border-primary/30 disabled:opacity-60"
            >
              <span className="font-mono text-[15px] font-medium text-primary num">{option.count}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-[13px] font-semibold tracking-tight">{option.title}</span>
                <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted-foreground">
                  {option.blurb}
                </span>
              </span>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-foreground/10 text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-foreground">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />}
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
        <SetupStepHeader
          step={1}
          title="Write this down"
          description="This is the only key to your wallet. Store it offline — never share it or type it into a website."
          onBack={() => setStep("choose")}
          backLabel="Word count"
        />

        <div className="mt-5">
          <SeedGrid mnemonic={mnemonic} />
        </div>

        <div className="mt-3 flex gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/[0.06] p-3">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" strokeWidth={1.9} />
          <p className="text-[10.5px] leading-relaxed text-muted-foreground">
            Anyone with these words controls your funds. Helix cannot recover them for you.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button
            onClick={() => setStep("verify")}
            className="h-11 flex-1 rounded-xl text-[12.5px] font-semibold shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.9)]"
          >
            I&apos;ve written it down
          </Button>
          <Button
            variant="ghost"
            onClick={() => setStep("choose")}
            className="h-11 rounded-xl px-3 text-[11.5px] text-muted-foreground"
          >
            Start over
          </Button>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <SeedVerify
        mnemonic={mnemonic}
        onVerified={() => setStep("pin")}
        onBack={() => setStep("phrase")}
      />
    );
  }

  return (
    <PinForm
      submitLabel="Create wallet"
      onSubmit={finish}
      busy={busy}
      error={error}
      onBack={() => setStep("verify")}
    />
  );
}