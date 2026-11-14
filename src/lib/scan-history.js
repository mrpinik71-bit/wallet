// Scan history, kept on this device only. A run stores its numbers and the
// funded wallets' addresses — never a recovery phrase, so the log holds nothing
// that could be used to move funds.
const KEY = "scan-history-v1";
const MAX_RUNS = 20;
const MAX_WALLETS = 200;

function stored() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Newest run first. */
export function readHistory() {
  return stored();
}

export function saveRun(run) {
  if (typeof window === "undefined") return;
  const entry = { ...run, wallets: (run.wallets || []).slice(0, MAX_WALLETS) };
  const next = [entry, ...stored()].slice(0, MAX_RUNS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // A full or blocked storage simply means this run is not kept.
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}