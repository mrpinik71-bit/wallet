import { useMemo, useState } from "react";
import { ChevronDown, ListOrdered } from "lucide-react";

// The file's wallets, opened on demand: the line number of each wallet on its own
// row. The phrase itself is never rendered. A line that is not a phrase is only
// counted, never listed.
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
            <div
              key={`${entry.line}-${position}`}
              className="flex items-center justify-between gap-2 border-b border-foreground/[0.04] py-1.5 last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-8 shrink-0 text-right text-[9.5px] num text-muted-foreground/45">
                  {position + 1}
                </span>
                <span className="shrink-0 text-[10.5px] font-medium num text-foreground/85">
                  Line {entry.line}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground/45">
                ••••••••
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