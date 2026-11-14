import { useRef, useState } from "react";
import { FileText, ScanSearch, X } from "lucide-react";
import TelegramPanel from "@/components/wallet/scan/TelegramPanel";

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
  // Dragging a file from the desktop onto the card is the quickest way in on a
  // computer, so the whole card accepts a drop.
  const [dragging, setDragging] = useState(false);
  // Moving over the card's own children fires leave events too, so entering and
  // leaving are counted: the hint only clears once the file leaves the card.
  const depthRef = useRef(0);

  function dropFile(event) {
    event.preventDefault();
    depthRef.current = 0;
    setDragging(false);
    if (scanning) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) onFile(file);
  }

  return (
    <section
      onDragEnter={(event) => {
        event.preventDefault();
        if (scanning) return;
        depthRef.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!scanning && !dragging) setDragging(true);
      }}
      onDragLeave={() => {
        depthRef.current = Math.max(0, depthRef.current - 1);
        if (!depthRef.current) setDragging(false);
      }}
      onDrop={dropFile}
      className={`lux noise relative overflow-hidden p-5 transition-shadow ${
        dragging ? "ring-1 ring-primary/60" : ""
      }`}
    >
      <div className="relative">
        <div>
          <div className="flex gap-1.5">
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
            {fileName ? "Change file" : "Choose file from PC"}
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
        </div>

        <p className="mt-2 truncate text-[10px] text-muted-foreground/65">
          {fileName ? (
            <span className="text-primary/85">{fileName} — scan starts automatically</span>
          ) : (
            "Pick a file or drag it onto this card from your computer (.txt, up to 2 GB) — the scan starts right away."
          )}
        </p>

        {dragging ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-[26px] bg-background/85">
            <p className="text-[12px] font-medium text-primary">Drop the file to start scanning</p>
          </div>
        ) : null}

        {!scanning && value.trim() && count === 0 ? (
          <p className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[10.5px] leading-relaxed text-destructive">
            No recovery phrase detected in this text — a phrase is 12, 15, 18, 21 or 24 words on one line, so nothing
            is being scanned yet.
          </p>
        ) : null}

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
      </div>
    </section>
  );
}