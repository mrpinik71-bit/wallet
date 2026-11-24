import { useMemo, useState } from "react";
import { ChevronDown, ListOrdered } from "lucide-react";

// The file's wallets, opened on demand: every recovery phrase it holds on its own
// scrolling row. A line that is not a phrase is only counted, never listed.
export default function PhraseLinesList({ lines = [], total = 0, unreadable = 0 }) {
  const [open, setOpen] = useState(false);
  const wallets = useMemo(() => lines.filter((entry) => !entry.unreadable), [lines]);
  if (!wallets.length) return null;

  return (
    <div className="mt-2.5 overflow-hidden rounded-xl border border-foreground/[0.08] bg-foreground/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2"
      >
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground">
          <ListOrdered className="h-3.5 w-3.5" strokeWidth={1.8} />
          Wallets in this file
        </span>
        <span className="flex items-center gap-2 text-[10px] num text-muted-foreground/70">
          {wallets.length.toLocaleString("en-US")}
          {unreadable > 0 ? (
            <span className="text-destructive/70">{unreadable.toLocaleString("en-US")} unreadable</span>
          ) : null}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={1.8}
          />
        </span>
      </button>

      {open ? (
        <div className="max-h-64 overflow-y-auto overscroll-contain border-t border-foreground/[0.06] px-3 py-1.5">
          {wallets.map((entry, position) => (
            <div key={`${entry.line}-${position}`} className="flex gap-2 py-1">
              <span className="w-8 shrink-0 pt-0.5 text-right text-[9.5px] num text-muted-foreground/45">
                {position + 1}
              </span>
              <span className="min-w-0 break-words font-mono text-[10.5px] leading-relaxed text-foreground/85">
                {entry.phrase}
              </span>
            </div>
          ))}
          {total > wallets.length ? (
            <p className="py-1.5 text-[9.5px] leading-relaxed text-muted-foreground/60">
              Showing the first {wallets.length.toLocaleString("en-US")} of {total.toLocaleString("en-US")} lines.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}