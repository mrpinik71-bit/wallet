import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <p className="eyebrow">Step 2 of 3</p>
      <h2 className="mt-2 font-heading text-lg font-semibold tracking-tight">Confirm your backup</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        Type the requested words exactly as they appear in your phrase.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {targets.map((index) => (
          <div key={index}>
            <Label htmlFor={`word-${index}`} className="text-[11px] text-muted-foreground">
              Word #{index + 1}
            </Label>
            <Input
              id={`word-${index}`}
              value={values[index] || ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [index]: event.target.value }))}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="mt-1.5 bg-secondary/40 font-mono text-[13px]"
            />
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-[12px] text-destructive">{error}</p>}

      <div className="mt-6 flex items-center gap-2">
        <Button type="submit" className="flex-1 rounded-xl">
          Verify backup
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} className="rounded-xl">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
        </Button>
      </div>
    </form>
  );
}