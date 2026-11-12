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
    <div className="rounded-2xl border border-foreground/[0.07] bg-foreground/[0.02] p-3">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground/70">
          Recovery phrase · {words.length} words
        </p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setHidden((value) => !value)}
            className="rounded-lg px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {hidden ? "Show" : "Hide"}
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <Check className="h-2.5 w-2.5 text-primary" /> : <Copy className="h-2.5 w-2.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div
        className={`mt-2.5 grid grid-cols-2 gap-1.5 transition-all sm:grid-cols-3 ${
          hidden ? "select-none blur-[6px]" : ""
        }`}
      >
        {words.map((word, index) => (
          <div
            key={`${word}-${index}`}
            className="flex items-baseline gap-2 rounded-xl border border-foreground/[0.05] bg-foreground/[0.03] px-2.5 py-1.5"
          >
            <span className="w-3.5 shrink-0 text-right font-mono text-[9px] text-muted-foreground/60">
              {index + 1}
            </span>
            <span className="truncate font-mono text-[11.5px] tracking-tight">{word}</span>
          </div>
        ))}
      </div>
    </div>
  );
}