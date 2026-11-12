import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import FundedExport from "@/components/wallet/scan/FundedExport";
import PhraseInput from "@/components/wallet/scan/PhraseInput";
import ScanSummary from "@/components/wallet/scan/ScanSummary";
import ScanResultRow from "@/components/wallet/scan/ScanResultRow";
import { fetchPricesFor } from "@/lib/chains/prices";
import { entriesFromList, parsePhrases, phrasesFromFile, scanAssets, scanPhraseStream } from "@/lib/phrase-scan";

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const PAGE = 100;

const EMPTY_LIVE = { completed: 0, fundedCount: 0, fundedTotal: 0, failed: 0, invalid: 0 };

export default function ScanWorkspace() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [stats, setStats] = useState({ ...EMPTY_LIVE });
  const [page, setPage] = useState(1);
  const [onlyFunded, setOnlyFunded] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const resultsRef = useRef([]);
  const liveRef = useRef({ ...EMPTY_LIVE });
  const cancelledRef = useRef(false);
  const countRef = useRef(0);
  const flushRef = useRef(null);

  // Never one render per phrase (a scan can hold millions), but a phrase that
  // comes back is pushed to the list within a moment of being found — results
  // appear one by one while the scan is still running.
  function scheduleFlush() {
    if (flushRef.current) return;
    flushRef.current = setTimeout(() => {
      flushRef.current = null;
      setStats({ ...liveRef.current });
      setVersion((value) => value + 1);
    }, 90);
  }

  useEffect(
    () => () => {
      if (flushRef.current) clearTimeout(flushRef.current);
    },
    [],
  );

  // The listed count is the truth: it is how many phrases were actually found
  // and checked, so the number on screen always matches the rows below it.
  const { rows, foundCount, fundedTotalCount } = useMemo(() => {
    // Guard here too, so a row can never render as "Unreadable phrase" — only
    // real wallets with their balances are listed.
    const list = resultsRef.current.filter((slot) => slot.status === "done");
    return {
      foundCount: list.length,
      fundedTotalCount: list.reduce((sum, slot) => sum + (slot.total > 0 ? 1 : 0), 0),
      rows: onlyFunded ? list.filter((slot) => slot.total > 0) : list,
    };
  }, [version, onlyFunded]);

  const visible = rows.slice(0, page * PAGE);

  function onChange(value) {
    setText(value);
    setFileName("");
    const entries = parsePhrases(value);
    setCount(entries.length);
    setTotal(entries.length);
  }

  async function readFile(file) {
    setError("");
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is larger than 2 GB. Split it into smaller .txt files.");
      return;
    }

    cancelledRef.current = true;
    setScanning(false);
    setEditing(true);
    setText("");
    setFileName(file.name);
    countRef.current = 0;
    setCount(0);
    setTotal(0);

    // The file is scanned as it is read: phrases beyond the first few thousand
    // are handled one at a time, so even a multi-gigabyte list stays in memory.
    await start(
      phrasesFromFile(file, {
        onCount: (value) => {
          countRef.current = value;
          setCount(value);
        },
      }),
    );
  }

  function startText() {
    const entries = parsePhrases(text);
    if (!entries.length) return;
    setCount(entries.length);
    setTotal(entries.length);
    start(entriesFromList(entries));
  }

  async function start(source) {
    if (!source || scanning) return;
    cancelledRef.current = false;
    liveRef.current = { ...EMPTY_LIVE };
    resultsRef.current = [];
    setPage(1);
    setEditing(false);
    setError("");
    setStats({ ...EMPTY_LIVE });
    setScanning(true);
    setVersion((value) => value + 1);

    const live = liveRef.current;

    try {
      const prices = await fetchPricesFor(scanAssets);
      await scanPhraseStream(source, {
        prices,
        isCancelled: () => cancelledRef.current,
        onResult: (result) => {
          // Only real, valid recovery phrases are listed — an unreadable line is
          // counted instead of taking a row in the results.
          if (result.status !== "done") {
            live.invalid += 1;
            scheduleFlush();
            return;
          }
          resultsRef.current.push(result);
          if (result.total > 0) {
            live.fundedCount += 1;
            live.fundedTotal += result.total;
          }
          if (result.failed) live.failed += result.failed;
          scheduleFlush();
        },
        onProgress: ({ completed }) => {
          live.completed = completed;
        },
      });
    } catch {
      setError("The scan stopped unexpectedly. Try again with fewer phrases.");
    } finally {
      if (flushRef.current) {
        clearTimeout(flushRef.current);
        flushRef.current = null;
      }
      cancelledRef.current = false;
      setScanning(false);
      // A file's phrase count is only known once it has been read through; a
      // stopped scan reports how many phrases were actually found.
      setTotal((current) => current || Math.max(countRef.current, resultsRef.current.length));
      setStats({ ...liveRef.current });
      setVersion((value) => value + 1);
    }
  }

  function reset() {
    cancelledRef.current = true;
    if (flushRef.current) {
      clearTimeout(flushRef.current);
      flushRef.current = null;
    }
    setScanning(false);
    resultsRef.current = [];
    liveRef.current = { ...EMPTY_LIVE };
    setStats({ ...EMPTY_LIVE });
    countRef.current = 0;
    setCount(0);
    setTotal(0);
    setPage(1);
    setOnlyFunded(false);
    setError("");
    setEditing(true);
  }

  function getFunded() {
    return resultsRef.current.filter((slot) => slot.total > 0);
  }

  const hasFunds = fundedTotalCount > 0;
  const scannedTotal = total || stats.completed || foundCount;

  return (
    <div className="relative">
      {editing ? (
        <PhraseInput
          value={text}
          fileName={fileName}
          onChange={onChange}
          onFile={readFile}
          error={error}
          onScan={startText}
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
            <p className="mt-1 text-[10px] text-muted-foreground/70 num">
              {foundCount.toLocaleString("en-US")} wallet{foundCount === 1 ? "" : "s"} found
              {total && total !== foundCount ? ` · ${total.toLocaleString("en-US")} phrases detected` : ""}
            </p>
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
            total={total}
            progress={{ completed: Math.max(stats.completed, foundCount), total }}
            fundedCount={fundedTotalCount}
            fundedTotal={stats.fundedTotal}
            onlyFunded={onlyFunded}
            onToggleFilter={() => {
              setOnlyFunded((value) => !value);
              setPage(1);
            }}
            finished={!scanning}
          />

          {!scanning && hasFunds ? <FundedExport getFunded={getFunded} scanned={scannedTotal} /> : null}

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

          {stats.failed > 0 ? (
            <p className="px-1 text-[10px] leading-relaxed text-muted-foreground/60">
              {stats.failed.toLocaleString("en-US")} chain read{stats.failed === 1 ? "" : "s"} failed on busy public
              nodes — those wallets may hold more than shown, so run the scan again for a full picture.
            </p>
          ) : null}

          {stats.invalid > 0 ? (
            <p className="px-1 text-[10px] leading-relaxed text-muted-foreground/60">
              {stats.invalid.toLocaleString("en-US")} entr{stats.invalid === 1 ? "y is" : "ies are"} not a valid BIP-39
              recovery phrase — {stats.invalid === 1 ? "it is" : "they are"} listed as unreadable.
            </p>
          ) : null}

          <div className="space-y-2">
            {visible.map((row, position) => (
              <ScanResultRow key={`${position}-${row.phrase}`} result={row} index={position} />
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

          {!scanning && foundCount > 0 && fundedTotalCount === 0 ? (
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
              {fundedTotalCount} wallet{fundedTotalCount === 1 ? "" : "s"} with funds — open one to copy its addresses.
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