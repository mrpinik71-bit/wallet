import { useRef, useState } from "react";
import { FileText, ScanSearch, X } from "lucide-react";
import PhraseLinesList from "@/components/wallet/scan/PhraseLinesList";
import TelegramPanel from "@/components/wallet/scan/TelegramPanel";

const SIZES = [12, 15, 18, 21, 24];

export default function PhraseInput({
  fileName,
  onFile,
  onCancel,
  scanning,
  reading,
  readStats = { bytes: 0, size: 0, lines: 0 },
  pendingCount,
  pendingInvalid = 0,
  suggest = 0,
  onStartFile,
  error,
  words,
  onWords,
  accounts = 1,
  onAccounts,
  deep = true,
  onDeep,
  lines = [],
  linesTotal = 0,
}) {
  const fileRef = useRef(null);
  // Dragging a file from the desktop onto the card is the quickest way in on a
  // computer, so the whole card accepts a drop.
  const [dragging, setDragging] = useState(false);
  // Moving over the card's own children fires leave events too, so entering and
  // leaving are counted: the hint only clears once the file leaves the card.
  const depthRef = useRef(0);
  // Reading a big file takes a while: the bar shows how much of it is done.
  const readPercent = readStats.size
    ? Math.min(100, Math.round((readStats.bytes / readStats.size) * 100))
    : 0;
  const mb = (bytes) => (bytes / 1048576).toFixed(bytes >= 10 * 1048576 ? 0 : 1);

  function dropFile(event) {
    event.preventDefault();
    depthRef.current = 0;
    setDragging(false);
    if (scanning || reading) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) onFile(file);
  }

  return (
    <section
      onDragEnter={(event) => {
        event.preventDefault();
        if (scanning || reading) return;
        depthRef.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!scanning && !reading && !dragging) setDragging(true);
      }}
      onDragLeave={() => {
        depthRef.current = Math.max(0, depthRef.current - 1);
        if (!depthRef.current) setDragging(false);
      }}
      onDrop={dropFile}
      className={`lux noise relative overflow-hidden p-4 transition-shadow ${
        dragging ? "ring-1 ring-primary/60" : ""
      }`}
    >
      <div className="relative">
        <div>
          <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
            Phrase length
          </p>
          <div className="flex gap-1.5">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onWords(size)}
                disabled={scanning || reading}
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
          <p className="mt-1.5 text-[9.5px] leading-relaxed text-muted-foreground/55">
            The file is read as {words}-word phrases — a line of another length is counted as unreadable.
          </p>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
            Accounts
          </span>
          <div className="flex flex-1 gap-1.5">
            {[1, 2, 3].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onAccounts(value)}
                disabled={scanning || reading || pendingCount > 0}
                className={`flex-1 rounded-lg border py-1.5 text-[10.5px] font-medium num transition-colors disabled:opacity-50 ${
                  accounts === value
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-foreground/[0.08] bg-foreground/[0.02] text-muted-foreground hover:text-foreground"
                }`}
              >
                {value === 1 ? "1st only" : `1st–${value}`}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-1.5 text-[9.5px] leading-relaxed text-muted-foreground/55">
          {accounts === 1
            ? "Only the first account of each phrase is checked."
            : `Account 1 to ${accounts} of every phrase are checked — the 2nd and 3rd accounts are derived from the same phrase and hold their own addresses.`}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
            Deep scan
          </span>
          <div className="flex flex-1 gap-1.5">
            {[
              [true, "Every token"],
              [false, "Fast"],
            ].map(([value, label]) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => onDeep(value)}
                disabled={scanning || reading || pendingCount > 0}
                className={`flex-1 rounded-lg border py-1.5 text-[10.5px] font-medium transition-colors disabled:opacity-50 ${
                  deep === value
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-foreground/[0.08] bg-foreground/[0.02] text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-1.5 text-[9.5px] leading-relaxed text-muted-foreground/55">
          {deep
            ? "Every other token each wallet holds is looked up too — the indexer allows a few calls a second, so this is the slow part."
            : "Only the catalog assets are checked — every chain answers in one batch, so a scan runs far faster."}
        </p>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-foreground/[0.14] bg-foreground/[0.02] px-2.5 py-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={scanning || reading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-foreground/[0.12] bg-foreground/[0.04] px-3 py-1.5 text-[10.5px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            <FileText className="h-3 w-3" strokeWidth={1.8} />
            {fileName ? "Change file" : "Choose file"}
          </button>
          <p className="min-w-0 flex-1 truncate text-[9.5px] leading-relaxed text-muted-foreground/55">
            or drag a .txt file here — up to 2 GB
          </p>
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
            <span className="text-primary/85">
              {fileName}
              {reading
                ? " — reading the whole file…"
                : pendingCount > 0
                  ? ` — ${pendingCount.toLocaleString("en-US")} wallets found${
                      pendingInvalid > 0
                        ? ` · ${pendingInvalid.toLocaleString("en-US")} unreadable`
                        : ""
                    }`
                  : ""}
            </span>
          ) : (
            "The file is read and counted first, then every wallet in it is checked."
          )}
        </p>

        <PhraseLinesList
          lines={lines}
          total={Math.max(0, linesTotal - pendingInvalid)}
          unreadable={pendingInvalid}
        />

        {suggest && !scanning && !reading && pendingCount === 0 ? (
          <div className="mt-2 rounded-xl border border-primary/25 bg-primary/[0.07] px-3 py-2">
            <p className="text-[10px] leading-relaxed text-primary/90">
              This file's lines are {suggest}-word phrases, but the length is set to {words} — so no wallet was found.
            </p>
            <button
              type="button"
              onClick={() => onWords(suggest)}
              className="mt-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[10px] font-medium text-primary"
            >
              Read as {suggest}-word phrases
            </button>
          </div>
        ) : null}

        {dragging ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-[26px] bg-background/85">
            <p className="text-[12px] font-medium text-primary">Drop the file to start scanning</p>
          </div>
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
        ) : reading ? (
          <div className="mt-4 rounded-xl border border-foreground/[0.1] bg-foreground/[0.025] px-3 py-2.5">
            <p className="flex items-center justify-center gap-1.5 text-center text-[10.5px] font-medium text-muted-foreground">
              <ScanSearch className="h-3.5 w-3.5 animate-pulse" strokeWidth={2} />
              Reading every line — counting the wallets first…
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/[0.08]">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${readPercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-[9.5px] num text-muted-foreground/70">
              {readStats.lines.toLocaleString("en-US")} lines · {mb(readStats.bytes)} of{" "}
              {mb(readStats.size)} MB · {readPercent}%
            </p>
          </div>
        ) : pendingCount > 0 ? (
          <button
            type="button"
            onClick={onStartFile}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[12.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ScanSearch className="h-4 w-4" strokeWidth={2} />
            Check {pendingCount.toLocaleString("en-US")} wallet{pendingCount === 1 ? "" : "s"} on all chains
          </button>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/[0.07] px-3 py-2.5 text-center text-[10.5px] font-medium text-primary/90">
            <ScanSearch className="h-3.5 w-3.5" strokeWidth={2} />
            Pick a file — its wallets are counted, then checked on every chain
          </p>
        )}

        {!scanning ? <TelegramPanel /> : null}
      </div>
    </section>
  );
}