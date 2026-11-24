import { Play, Square, Zap } from "lucide-react";

const SIZES = [12, 15, 18, 21, 24];

/**
 * Chain-read tester: streams freshly generated random phrases into the scan a
 * second at a time, so the answer to "which chain failed to reply?" shows up on
 * its own instead of needing a file.
 */
export default function AutoGenerator({
  running,
  sizes,
  onSizes,
  onStart,
  onStop,
  generated = 0,
  checked = 0,
  failed = 0,
  chainFailures = [],
}) {
  function toggleSize(size) {
    if (running) return;
    const next = sizes.includes(size) ? sizes.filter((value) => value !== size) : [...sizes, size];
    // At least one length stays selected, otherwise nothing would be generated.
    onSizes(SIZES.filter((value) => next.includes(value)));
  }

  const idle = !running && checked === 0;

  return (
    <section className="lux noise relative mb-3 overflow-hidden p-4">
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground/60">
              Chain read tester
            </p>
            <p className="mt-1 font-display text-[19px] leading-none">Random wallet stream</p>
          </div>
          <span
            className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${
              running
                ? "border-primary/45 bg-primary/15 text-primary"
                : "border-foreground/[0.1] bg-foreground/[0.03] text-muted-foreground"
            }`}
          >
            <Zap className="h-2.5 w-2.5" strokeWidth={2.4} />
            {running ? "Live" : "Idle"}
          </span>
        </div>

        <p className="mt-2 text-[9.5px] leading-relaxed text-muted-foreground/60">
          One new random phrase a second, taking the lengths in turn — 12, 15, 18, 21, 24 — then starting over with
          fresh randomness: a full round every five seconds. Nobody holds these keys, so every wallet is empty — a
          failed network read is the only thing left to see.
        </p>

        <div className="mt-2.5 flex gap-1.5">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              disabled={running}
              className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium num transition-colors disabled:opacity-60 ${
                sizes.includes(size)
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-foreground/[0.08] bg-foreground/[0.02] text-muted-foreground"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={running ? onStop : onStart}
          className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[12.5px] font-semibold transition-opacity ${
            running
              ? "border border-destructive/40 text-destructive"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {running ? <Square className="h-3.5 w-3.5" strokeWidth={2.4} /> : <Play className="h-3.5 w-3.5" strokeWidth={2.4} />}
          {running ? "Stop auto test" : "Start auto test"}
        </button>

        {!idle ? (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                ["Phrases", generated],
                ["Wallets", checked],
                ["Failed reads", failed],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-foreground/[0.07] bg-foreground/[0.02] px-2 py-1.5">
                  <p className="text-[8.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
                    {label}
                  </p>
                  <p
                    className={`mt-0.5 text-[13px] font-semibold num ${
                      label === "Failed reads" && value > 0 ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {value.toLocaleString("en-US")}
                  </p>
                </div>
              ))}
            </div>

            {chainFailures.length ? (
              <div className="rounded-xl border border-destructive/25 bg-destructive/[0.07] px-2.5 py-2">
                <p className="text-[8.5px] font-medium uppercase tracking-[0.16em] text-destructive/80">
                  Chains that did not answer
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {chainFailures.map((entry) => (
                    <span
                      key={entry.symbol}
                      className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[9.5px] font-medium num text-destructive"
                    >
                      {entry.symbol} · {entry.count.toLocaleString("en-US")}
                    </span>
                  ))}
                </div>
              </div>
            ) : checked > 0 ? (
              <p className="rounded-xl border border-primary/25 bg-primary/[0.07] px-2.5 py-2 text-[9.5px] leading-relaxed text-primary/90">
                Every chain answered — no failed reads so far.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}