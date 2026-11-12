import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import PhraseInput from "@/components/wallet/scan/PhraseInput";
import ScanSummary from "@/components/wallet/scan/ScanSummary";
import ScanResultRow from "@/components/wallet/scan/ScanResultRow";
import { fetchPrices } from "@/lib/chains/prices";
import { parsePhrases, scanPhrases } from "@/lib/phrase-scan";

export const Route = createFileRoute("/_authed/scan")({
  head: () => ({
    meta: [
      { title: "Batch scan — Helix" },
      { name: "description", content: "Check the balances of many recovery phrases at once, on this device." },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [editing, setEditing] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [slots, setSlots] = useState([]);
  const [onlyFunded, setOnlyFunded] = useState(false);
  const [error, setError] = useState("");
  const cancelledRef = useRef(false);

  const entries = useMemo(() => parsePhrases(text), [text]);

  const funded = slots.filter((slot) => slot && slot.total > 0);
  const fundedTotal = funded.reduce((sum, slot) => sum + slot.total, 0);
  const rows = slots.map((slot, index) => ({ slot, index })).filter((row) => row.slot);
  const visible = onlyFunded ? rows.filter((row) => row.slot.total > 0) : rows;

  async function readFile(file) {
    const content = await file.text();
    setText(content);
    setFileName(file.name);
    const parsed = parsePhrases(content);
    if (parsed.length > 0) await start(parsed);
  }

  async function start(entriesToScan = entries) {
    if (!entriesToScan.length || scanning) return;
    cancelledRef.current = false;
    setEditing(false);
    setError("");
    setSlots([]);
    setScanning(true);
    setProgress({ completed: 0, total: entriesToScan.length });
    try {
      const prices = await fetchPrices();
      await scanPhrases(entriesToScan, {
        prices,
        isCancelled: () => cancelledRef.current,
        onProgress: ({ completed, index, result }) => {
          setProgress({ completed, total: entriesToScan.length });
          setSlots((previous) => {
            const next = [...previous];
            next[index] = result;
            return next;
          });
        },
      });
    } catch {
      setError("The scan stopped unexpectedly. Try again with fewer phrases.");
    } finally {
      setScanning(false);
    }
  }

  function reset() {
    cancelledRef.current = true;
    setScanning(false);
    setSlots([]);
    setProgress({ completed: 0, total: 0 });
    setOnlyFunded(false);
    setError("");
    setEditing(true);
  }

  return (
    <div className="relative mx-auto w-full max-w-[458px] lg:max-w-[720px]">
      <div
        aria-hidden="true"
        className="glow-mint pointer-events-none absolute -top-16 left-1/2 h-40 w-[320px] -translate-x-1/2 opacity-60"
      />

      <div className="relative">
        {editing ? (
          <PhraseInput
            value={text}
            fileName={fileName}
            onChange={(value) => {
              setText(value);
              setFileName("");
            }}
            onFile={readFile}
            onScan={() => start()}
            onCancel={() => {
              cancelledRef.current = true;
              setScanning(false);
            }}
            scanning={scanning}
            count={entries.length}
          />
        ) : (
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-muted-foreground/70">Batch scan</p>
              <p className="mt-1.5 font-display text-[22px] leading-none">Results</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.1] bg-foreground/[0.03] px-3 py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              New scan
            </button>
          </div>
        )}

        {!editing ? (
          <div className="mt-4 space-y-2.5">
            <ScanSummary
              results={rows.map((row) => row.slot)}
              progress={progress}
              fundedCount={funded.length}
              fundedTotal={fundedTotal}
              onlyFunded={onlyFunded}
              onToggleFilter={() => setOnlyFunded((value) => !value)}
              finished={!scanning}
            />

            {scanning ? (
              <button
                type="button"
                onClick={() => {
                  cancelledRef.current = true;
                }}
                className="w-full rounded-xl border border-foreground/[0.1] py-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Stop scan
              </button>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              {visible.map((row) => (
                <ScanResultRow key={row.index} result={row.slot} index={row.index} />
              ))}
            </div>

            {!scanning && rows.length > 0 && funded.length === 0 ? (
              <div className="lux noise relative p-4 text-center">
                <p className="relative font-display text-[18px] leading-tight">No funds on these wallets</p>
                <p className="relative mx-auto mt-1.5 max-w-[300px] text-[10.5px] leading-relaxed text-muted-foreground/80">
                  Airdrop balances may sit on chains or tokens outside this scan. Open a result to check its addresses on a
                  block explorer.
                </p>
              </div>
            ) : null}

            {!scanning && funded.length > 0 ? (
              <p className="px-1 pt-1 text-[10.5px] leading-relaxed text-muted-foreground/70">
                {funded.length} wallet{funded.length === 1 ? "" : "s"} with funds — open one to copy its addresses.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex items-start gap-2.5 rounded-[18px] border border-foreground/[0.06] bg-foreground/[0.02] p-3.5">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.9} />
          <p className="text-[10px] leading-relaxed text-muted-foreground/75">
            Derivation happens in this browser. Only public addresses are queried against the chains, and the phrases are
            never stored or sent anywhere.
          </p>
        </div>
      </div>
    </div>
  );
}