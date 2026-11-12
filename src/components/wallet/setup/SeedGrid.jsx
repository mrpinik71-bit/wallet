import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function SeedGrid({ mnemonic }) {
  const [copied, setCopied] = useState(false);
  const [hidden, setHidden] = useState(false);
  const words = mnemonic.split(" ");

  async function copy() {
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="eyebrow">Recovery phrase · {words.length} words</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            className="rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {hidden ? "Show" : "Hide"}
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div
        className={`mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 ${
          hidden ? "blur-sm select-none" : ""
        } transition-all`}
      >
        {words.map((word, index) => (
          <div
            key={`${word}-${index}`}
            className="flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-2.5 py-2"
          >
            <span className="w-4 text-right font-mono text-[10px] text-muted-foreground">{index + 1}</span>
            <span className="font-mono text-[12px] tracking-tight">{word}</span>
          </div>
        ))}
      </div>
    </div>
  );
}