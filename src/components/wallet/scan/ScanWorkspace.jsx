import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import FundedExport from "@/components/wallet/scan/FundedExport";
import PhraseInput from "@/components/wallet/scan/PhraseInput";
import RpcKeysPanel from "@/components/wallet/scan/RpcKeysPanel";
import ScanProgress from "@/components/wallet/scan/ScanProgress";
import ScanSummary from "@/components/wallet/scan/ScanSummary";
import ScanHistory from "@/components/wallet/scan/ScanHistory";
import ScanResultRow from "@/components/wallet/scan/ScanResultRow";
import { buildWalletMessage } from "@/lib/funded-report";
import { savedBot, sendMessage } from "@/lib/telegram-bot";
import { saveRun } from "@/lib/scan-history";
import { fetchPricesFor } from "@/lib/chains/prices";
import { isValidPhrase } from "@/lib/phrase-checksum";
import useWakeLock from "@/hooks/useWakeLock";
import {
  countPhrasesInFile,
  entriesFromList,
  parsePhrases,
  phrasesFromFile,
  scanAssets,
  scanPhraseStream,
} from "@/lib/phrase-scan";

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const PAGE = 100;
// Pasting or typing pauses for a moment, then the new lines are scanned: no
// button to press, and a half-typed line is not sent on every keystroke.
const AUTO_DELAY = 700;

const EMPTY_LIVE = {
  completed: 0,
  started: 0,
  fundedCount: 0,
  fundedTotal: 0,
  failed: 0,
  invalid: 0,
  // The batch currently being checked, so the run is shown batch by batch.
  batch: null,
  // How many funded wallets were delivered to the linked chat.
  sent: 0,
};

export default function ScanWorkspace() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  // A chosen file is read through first: its wallets are counted, and only then
  // does the chain check start — in batches, on request.
  const [reading, setReading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [count, setCount] = useState(0);
  // Lines that are not real BIP-39 phrases: counted apart, never scanned.
  const [unreadable, setUnreadable] = useState(0);
  const [words, setWords] = useState(12);
  // How many accounts of each phrase are checked: 1 is the phrase's first
  // wallet, 3 also checks the second and third accounts it derives.
  const [accounts, setAccounts] = useState(3);
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
  // Bumped whenever a run is logged, so the history section re-reads its list.
  const [historyKey, setHistoryKey] = useState(0);

  const resultsRef = useRef([]);
  // Phrases already queued or scanned: editing the text again only sends the
  // new lines, so a scan never repeats work it already did.
  const seenRef = useRef(new Set());
  const queueRef = useRef([]);
  // The file waiting for its chain check, kept until the scan is started.
  const pendingFileRef = useRef(null);
  // Funded wallets are delivered one after another, never in one burst.
  const sendChainRef = useRef(Promise.resolve());
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

  // Each line is read with the selected number of words (12, 15, …). A line
  // that is not a real BIP-39 phrase (word list + checksum) is not a wallet, so
  // it is counted as unreadable and kept out of the scan.
  const matching = (value, size) => {
    const all = parsePhrases(value, size);
    const valid = all.filter((entry) => isValidPhrase(entry.phrase.split(" ")));
    setUnreadable(all.length - valid.length);
    return valid;
  };

  function onChange(value) {
    setText(value);
    setFileName("");
    const entries = matching(value, words);
    setCount(entries.length);
    if (!entries.length) setTotal(seenRef.current.size * accounts);
  }

  function changeWords(size) {
    setWords(size);
    const entries = matching(text, size);
    setCount(entries.length);
    setTotal(entries.length * accounts);
  }

  // The account count applies to the next scan, so the totals on screen follow it.
  function changeAccounts(value) {
    setAccounts(value);
    setTotal((current) => Math.round(current / accounts) * value);
  }

  // Every funded wallet goes to the linked Telegram chat as soon as its balances
  // land — no button to press. Sends are queued, so a burst of funded wallets
  // never trips Telegram's rate limit.
  function deliverFunded(result) {
    const bot = savedBot();
    if (!bot.token || !bot.chatId) return;
    sendChainRef.current = sendChainRef.current
      .then(async () => {
        await sendMessage(bot.token, bot.chatId, buildWalletMessage(result));
        liveRef.current.sent += 1;
        scheduleFlush();
      })
      .catch(() => {
        // A failed send must never stop the scan.
      });
  }

  // Everything the scan reports goes through here, so a pasted list and a file
  // fill the results the same way.
  function scanHandlers(prices) {
    const live = liveRef.current;
    return {
      prices,
      accounts,
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
          // A wallet holding funds is sent to the linked chat on its own.
          deliverFunded(result);
        }
        if (result.failed) live.failed += result.failed;
        scheduleFlush();
      },
      onProgress: ({ completed, started: begun, batch }) => {
        live.completed = completed;
        if (begun !== undefined) live.started = begun;
        if (batch) live.batch = batch;
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
        new Promise((resolve) => setTimeout(() => resolve({}), 2500)),
      ]);
    }
    return pricesRef.current;
  }

  // Every finished run is logged: funded wallets keep a row with their
  // addresses, the rest are only counted, so the log never holds a phrase.
  function recordRun(slice) {
    const scanned = slice.filter((slot) => slot.status === "done");
    if (!scanned.length) return;
    const funded = scanned.filter((slot) => slot.total > 0);
    saveRun({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: Date.now(),
      scanned: scanned.length,
      funded: funded.length,
      total: funded.reduce((sum, slot) => sum + slot.total, 0),
      wallets: funded.map((slot) => ({
        line: slot.line,
        account: slot.account || 0,
        total: slot.total,
        funded: slot.funded,
        addresses: slot.addresses,
        failed: slot.failed,
        failedChains: slot.failedChains,
      })),
    });
    setHistoryKey((value) => value + 1);
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
    setTotal(seenRef.current.size * accounts);
    setStarted(true);
    pump();
  }

  // One worker drains the queue: lines added while a scan is running join it
  // and are checked as soon as the current batch lands.
  async function pump() {
    if (busyRef.current) return;
    busyRef.current = true;
    cancelledRef.current = false;
    // Only what this run adds is logged, so typing more never rewrites old runs.
    const startAt = resultsRef.current.length;
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
      setTotal((seenRef.current.size || resultsRef.current.length) * accounts);
      setStats({ ...liveRef.current });
      setVersion((value) => value + 1);
      recordRun(resultsRef.current.slice(startAt));
      scheduleExport();
    }
  }

  function clearResults() {
    resultsRef.current = [];
    seenRef.current = new Set();
    queueRef.current = [];
    pendingFileRef.current = null;
    setPendingCount(0);
    setReading(false);
    liveRef.current = { ...EMPTY_LIVE };
    countRef.current = 0;
    startedAtRef.current = 0;
    setStats({ ...EMPTY_LIVE });
    setStarted(false);
    setCount(0);
    setUnreadable(0);
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

  // Step 1: the whole file is read through first and its wallets are counted —
  // no chain is asked about until that number is on screen.
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

    cancelledRef.current = false;
    pendingFileRef.current = null;
    setReading(true);

    try {
      const { count: found, invalid } = await countPhrasesInFile(file, {
        words,
        onProgress: (value, bad) => {
          countRef.current = value;
          setCount(value);
          setUnreadable(bad);
        },
      });
      pendingFileRef.current = { file, count: found };
      setPendingCount(found);
      setUnreadable(invalid);
      setTotal(found * accounts);
    } catch {
      setError("That file could not be read. Try a plain .txt file.");
    } finally {
      setReading(false);
    }
  }

  // Step 2: the file is read again and its wallets are checked chain by chain,
  // in batches, with every result landing as soon as it is read.
  async function startFileScan() {
    const pending = pendingFileRef.current;
    if (!pending) return;

    pendingFileRef.current = null;
    setPendingCount(0);
    busyRef.current = true;
    cancelledRef.current = false;
    setScanning(true);
    setStarted(true);
    startedAtRef.current = Date.now();
    setElapsed(0);
    setError("");

    try {
      const prices = await resolvePrices();
      await scanPhraseStream(
        phrasesFromFile(pending.file, {
          words,
          onCount: (value) => {
            countRef.current = value;
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
      setTotal((current) => current || Math.max(countRef.current, resultsRef.current.length) * accounts);
      setStats({ ...liveRef.current });
      setVersion((value) => value + 1);
      recordRun(resultsRef.current);
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
  // Unreadable lines never reach the scan, so they are reported on their own.
  const unreadableTotal = unreadable + stats.invalid;

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
        reading={reading}
        pendingCount={pendingCount}
        pendingInvalid={unreadable}
        onStartFile={startFileScan}
        count={count}
        words={words}
        onWords={changeWords}
        accounts={accounts}
        onAccounts={changeAccounts}
      />

      <RpcKeysPanel />

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
              {unreadableTotal > 0 ? (
                <p className="mt-1 text-[10px] font-medium text-destructive/75 num">
                  {unreadableTotal.toLocaleString("en-US")} unreadable line
                  {unreadableTotal === 1 ? "" : "s"} skipped
                </p>
              ) : null}
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
            invalid={unreadableTotal}
            failed={stats.failed}
            batch={stats.batch}
            sent={stats.sent}
            finished={!scanning}
          />

          {exportReady ? <FundedExport getFunded={getFunded} getAll={getAll} scanned={scannedTotal} /> : null}

          {stats.failed > 0 ? (
            <p className="px-1 text-[10px] leading-relaxed text-muted-foreground/60">
              {stats.failed.toLocaleString("en-US")} chain read{stats.failed === 1 ? "" : "s"} failed on busy public
              nodes — those wallets may hold more than shown, so run the scan again for a full picture.
            </p>
          ) : null}

          {unreadableTotal > 0 ? (
            <p className="px-1 text-[10px] leading-relaxed text-muted-foreground/60">
              {unreadableTotal.toLocaleString("en-US")} line{unreadableTotal === 1 ? " is" : "s are"} not a valid BIP-39
              recovery phrase (word list + checksum), so {unreadableTotal === 1 ? "it was" : "they were"} kept out of the
              scan as unreadable.
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

      <ScanHistory refreshKey={historyKey} />
    </div>
  );
}