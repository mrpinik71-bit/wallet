import { useRef } from "react";
import { FileText, ScanSearch, X } from "lucide-react";
import TelegramPanel from "@/components/wallet/scan/TelegramPanel";
import { SCAN_ASSETS, SCAN_CHAINS } from "@/lib/chains/scan-catalog";

const SIZES = [12, 15, 18, 21, 24];

export default function PhraseInput({
  value,
  fileName,
  onChange,
  onFile,
  onCancel,
  scanning,
  count,
  error,
  words,
  onWords,
}) {
  const fileRef = useRef(null);

  return (
    <section className="lux noise relative overflow-hidden p-5">
      <div className="relative">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground/60">Phrase length</p>
          <div className="mt-2 flex gap-1.5">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onWords(size)}
                disabled={scanning}
                className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium num transition-colors disabled:opacity-50 ${
                  words === size
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-foreground/[0.08] bg-foreground/[0.02] text-muted-foreground hover:text-foreground"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground/60">
            Every line is scanned with its first {words} words — a line that already holds a full 12–24 word phrase is
            checked whole as well. Numbering, labels and commas around a phrase are ignored, and a phrase written across several
            lines is joined back together.
          </p>
        </div>

        <div className="relative mt-4">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={7}
            spellCheck={false}
            autoCapitalize="none"
            disabled={scanning}
            placeholder={"word one two three …\nword one two three …"}
            className="w-full resize-none rounded-2xl border border-foreground/[0.08] bg-foreground/[0.025] p-3.5 font-mono text-[11.5px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 disabled:opacity-60"
          />
          {value && !scanning ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear phrases"
              className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.1] bg-foreground/[0.03] px-3 py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={1.8} />
            {fileName ? "Change file" : "Upload .txt file"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,.json,.md,text/plain,text/csv,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = "";
            }}
          />
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/60 num">
            {count} {count === 1 ? "phrase" : "phrases"}
          </p>
        </div>

        <p className="mt-2 truncate text-[10px] text-muted-foreground/65">
          {fileName ? (
            <span className="text-primary/85">{fileName} — scan starts automatically</span>
          ) : (
            "Uploading a file (.txt, up to 2 GB) starts the balance scan right away."
          )}
        </p>

        {error && !scanning ? (
          <p className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            {error}
          </p>
        ) : null}

        {scanning ? (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 text-[12.5px] font-semibold text-destructive"
          >
            <X className="h-4 w-4" />
            Stop scan
          </button>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/[0.07] px-3 py-2.5 text-center text-[10.5px] font-medium text-primary/90">
            <ScanSearch className="h-3.5 w-3.5" strokeWidth={2} />
            {count > 0 ? "Scanning your lines on its own — no button needed" : "Scanning starts by itself as you paste or type"}
          </p>
        )}

        {!scanning ? <TelegramPanel /> : null}

        <p className="mt-3 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/45">
          {SCAN_CHAINS.length} chains · {SCAN_ASSETS.length} assets per wallet
        </p>
      </div>
    </section>
  );
}