import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { downloadFundedPhrases } from "@/lib/download-funded";
import PhraseInput from "@/components/wallet/scan/PhraseInput";
import ScanSummary from "@/components/wallet/scan/ScanSummary";
import ScanResultRow from "@/components/wallet/scan/ScanResultRow";
import { fetchPricesFor } from "@/lib/chains/prices";
import { parsePhrases, scanAssets, scanPhrases } from "@/lib/phrase-scan";
import { readChunks } from "@/lib/scan-file";

const MAX_FILE_BYTES = 500 * 1024 * 1024;
// Every result is kept for the first few thousand phrases (so their addresses
// stay inspectable); after that only wallets holding funds are stored, which is
// what keeps a million-phrase scan inside browser memory.
const RAW_KEEP = 4000;
const PAGE = 100;

const EMPTY_LIVE = { completed: 0, fundedCount: 0, fundedTotal: 0, failed: 0 };

export default function ScanWorkspace() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [count, setCount] = useState(0);
  const [editing, setEditing] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [stats, setStats] = useState({ ...EMPTY_LIVE, total: 0 });
  const [page, setPage] = useState(1);
  const [onlyFunded, setOnlyFunded] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const entriesRef = useRef([]);
  const resultsRef = useRef([]);
  const liveRef = useRef({ ...EMPTY_LIVE });
  const cancelledRef = useRef(false);

  // A million results must never trigger a million renders: the counters and
  // the list are flushed to the screen a few times a second while scanning.
  useEffect(() => {
    if (!scanning) return undefined;
    const timer = setInterval(() => {
      setStats((previous) => ({ ...previous, ...liveRef.current }));
      setVersion((value) => value + 1);
    }, 450);
    return () => clearInterval(timer);
  }, [scanning]);

  const rows = useMemo(() => {
    const list = [];
    const results = resultsRef.current;
    for (let index = 0; index < results.length; index += 1) {
      const slot = results[index];
      if (!slot) continue;
      if (onlyFunded && !(slot.total > 0)) continue;
      list.push({ slot, index });
    }
    return list;
  }, [version, onlyFunded]);

  const visible = rows.slice(0, page * PAGE);

  function onChange(value) {
    setText(value);
    setFileName("");
    entriesRef.current = parsePhrases(value);
    setCount(entriesRef.current.length);
  }

  async function readFile(file) {
    setError("");
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is larger than 500 MB. Split it into smaller .txt files.");
      return;
    }

    cancelledRef.current = true;
    setScanning(false);
    setEditing(true);
    setText("");
    setFileName(file.name);

    const seen = new Set();
    const collected = [];
    try {
      await readChunks(file, (chunk) => {
        for (const entry of parsePhrases(chunk)) {
          const key = entry.phrase.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          collected.push(entry);
        }
        entriesRef.current = collected;
        setCount(collected.length);
      });
    } catch {
      setError("That file could not be read. Use a plain .txt file with one phrase per line.");
      return;
    }

    if (collected.length === 0) {
      setError("No recovery phrases were found in that file.");
      return;
    }
    await start(collected);
  }

  async function start(entriesToScan = entriesRef.current) {
    if (!entriesToScan.length || scanning) return;
    cancelledRef.current = false;
    liveRef.current = { ...EMPTY_LIVE };
    resultsRef.current = [];
    setPage(1);
    setEditing(false);
    setError("");
    setStats({ ...EMPTY_LIVE, total: entriesToScan.length });
    setScanning(true);
    setVersion((value) => value + 1);

    const live = liveRef.current;

    try {
      const prices = await fetchPricesFor(scanAssets);
      await scanPhrases(entriesToScan, {
        prices,
        isCancelled: () => cancelledRef.current,
        onProgress: ({ completed, index, result }) => {
          const worthwhile = result.total > 0 || result.status === "invalid" || index < RAW_KEEP;
          if (worthwhile) resultsRef.current[index] = result;
          live.completed = completed;
          if (result.total > 0) {
            live.fundedCount += 1;
            live.fundedTotal += result.total;
          }
          if (result.failed) live.failed += result.failed;
        },
      });
    } catch {
      setError("The scan stopped unexpectedly. Try again with fewer phrases.");
    } finally {
      cancelledRef.current = false;
      setScanning(false);
      setStats((previous) => ({ ...previous, ...live }));
      setVersion((value) => value + 1);
    }
  }

  function reset() {
    cancelledRef.current = true;
    setScanning(false);
    resultsRef.current = [];
    liveRef.current = { ...EMPTY_LIVE };
    setStats({ ...EMPTY_LIVE, total: 0 });
    setPage(1);
    setOnlyFunded(false);
    setError("");
    setEditing(true);
  }

  function downloadFunded() {
    const funded = resultsRef.current.filter((slot) => slot && slot.total > 0);
    if (funded.length > 0) downloadFundedPhrases(funded);
  }

  const hasFunds = stats.fundedCount > 0;

  return (
    <div className="relative">
      {editing ? (
        <PhraseInput
          value={text}
          fileName={fileName}
          onChange={onChange}
          onFile={readFile}
          error={error}
          onScan={() => start()}
          onCancel={() => {
            cancelledRef.current = true;
            setScanning(false);
          }}
          scanning={scanning}
          count={count}
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
            total={stats.total}
            progress={{ completed: stats.completed, total: stats.total }}
            fundedCount={stats.fundedCount}
            fundedTotal={stats.fundedTotal}
            onlyFunded={onlyFunded}
            onToggleFilter={() => {
              setOnlyFunded((value) => !value);
              setPage(1);
            }}
            finished={!scanning}
          />

          {!scanning && hasFunds ? (
            <button
              type="button"
              onClick={downloadFunded}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[11.5px] font-semibold text-primary-foreground shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.9)] active:opacity-90"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.1} />
              Download {stats.fundedCount} funded phrase{stats.fundedCount === 1 ? "" : "s"}
            </button>
          ) : null}

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

          {rows.length > visible.length ? (
            <button
              type="button"
              onClick={() => setPage((value) => value + 1)}
              className="w-full rounded-xl border border-foreground/[0.1] py-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Show {Math.min(PAGE, rows.length - visible.length)} more · {rows.length - visible.length} left
            </button>
          ) : null}

          {stats.total > RAW_KEEP ? (
            <p className="px-1 text-[10px] leading-relaxed text-muted-foreground/60">
              Only wallets holding funds are listed after the first {RAW_KEEP.toLocaleString("en-US")} phrases — every
              phrase in the list was still checked.
            </p>
          ) : null}

          {!scanning && stats.completed > 0 && stats.fundedCount === 0 ? (
            <div className="lux noise relative p-4 text-center">
              <p className="relative font-display text-[18px] leading-tight">No funds on these wallets</p>
              <p className="relative mx-auto mt-1.5 max-w-[300px] text-[10.5px] leading-relaxed text-muted-foreground/80">
                Airdrop balances may sit on chains or tokens outside this scan. Open a result to check its addresses on a
                block explorer.
              </p>
            </div>
          ) : null}

          {!scanning && hasFunds ? (
            <p className="px-1 pt-1 text-[10.5px] leading-relaxed text-muted-foreground/70">
              {stats.fundedCount} wallet{stats.fundedCount === 1 ? "" : "s"} with funds — open one to copy its addresses.
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
  );
}