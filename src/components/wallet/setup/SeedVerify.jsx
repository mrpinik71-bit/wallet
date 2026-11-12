import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SetupStepHeader from "./SetupStepHeader";
import { pickRandomIndexes } from "@/lib/bip39";

export default function SeedVerify({ mnemonic, onVerified, onBack }) {
  const words = mnemonic.split(" ");
  const [targets] = useState(() => pickRandomIndexes(words.length, 3));
  const [values, setValues] = useState({});
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const matches = targets.every(
      (index) => (values[index] || "").trim().toLowerCase() === words[index],
    );
    if (!matches) {
      setError("Those words do not match your backup. Check the phrase and try again.");
      return;
    }
    setError("");
    onVerified();
  }

  return (
    <form onSubmit={submit}>
      <SetupStepHeader
        step={2}
        title="Confirm your backup"
        description="Type the requested words exactly as they appear in your phrase."
        onBack={onBack}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {targets.map((index) => (
          <div key={index}>
            <Label
              htmlFor={`word-${index}`}
              className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70"
            >
              Word #{index + 1}
            </Label>
            <Input
              id={`word-${index}`}
              value={values[index] || ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [index]: event.target.value }))}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="mt-1.5 h-10 rounded-none border-0 border-b border-foreground/15 bg-transparent px-0 font-mono text-[13px] shadow-none focus-visible:border-primary focus-visible:ring-0"
            />
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-[11.5px] text-destructive">{error}</p>}

      <div className="mt-6 flex items-center gap-2">
        <Button
          type="submit"
          className="h-11 flex-1 rounded-xl text-[12.5px] font-semibold shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.9)]"
        >
          Verify backup
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-11 rounded-xl px-3 text-[11.5px] text-muted-foreground"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.8} /> Back
        </Button>
      </div>
    </form>
  );
}