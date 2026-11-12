// Bulk recovery-phrase balance scanner. Everything runs on this device: phrases
// are only used to derive addresses, and only those addresses are sent to RPCs.
import { cardanoAddresses } from "@/lib/chains/cardano";
import { getAddresses } from "@/lib/chains/derive";
import { readBalance } from "@/lib/chains/portfolio";
import { priceOf } from "@/lib/chains/prices";
import { SCAN_ASSETS, SCAN_CHAINS } from "@/lib/chains/scan-catalog";
import WORDLIST from "@/lib/bip39-words.json";
import { validateMnemonic } from "@/lib/bip39";

export const scanAssets = SCAN_ASSETS;
export const scanChains = SCAN_CHAINS;

const WORD_SET = new Set(WORDLIST);
const PHRASE_SIZES = new Set([12, 15, 18, 21, 24]);

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

// One line often carries more than the phrase — an index, a label, an address
// or a private key. Only the standard words are taken, so a phrase buried in
// that text is still recognised instead of being dropped with the whole line.
function candidatesFromLine(line) {
  const tokens = tokenize(line);
  if (tokens.length < 12) return [];

  const found = [];
  // A line that is exactly one phrase is taken as-is; when a word is mistyped
  // it is still reported as invalid later instead of vanishing.
  if (PHRASE_SIZES.has(tokens.length)) found.push(tokens.join(" "));

  // Otherwise every uninterrupted run of standard words is a candidate.
  let run = [];
  const flush = () => {
    if (run.length >= 12) {
      if (PHRASE_SIZES.has(run.length)) found.push(run.join(" "));
      else if (run.length > 24) {
        for (let i = 0; i + 12 <= run.length; i += 12) found.push(run.slice(i, i + 12).join(" "));
      } else found.push(run.slice(0, 12).join(" "));
    }
    run = [];
  };
  for (const token of tokens) {
    if (WORD_SET.has(token)) run.push(token);
    else flush();
  }
  flush();
  return found;
}

/** Splits pasted text or a .txt file into individual recovery phrases. */
export function parsePhrases(text) {
  const seen = new Set();
  const entries = [];
  const add = (phrase) => {
    const key = phrase.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ phrase, words: phrase.split(" ").length });
  };

  const blocks = String(text || "")
    .replace(/\r/g, "")
    .split(/\n\s*\n/);

  for (const block of blocks) {
    const before = entries.length;
    for (const line of block.split("\n")) {
      for (const phrase of candidatesFromLine(line)) add(phrase);
    }
    // A phrase wrapped over a couple of lines is joined back together.
    if (entries.length === before) {
      const tokens = tokenize(block);
      if (PHRASE_SIZES.has(tokens.length)) add(tokens.join(" "));
    }
  }
  return entries;
}

async function scanOne(entry, prices) {
  const base = { phrase: entry.phrase, words: entry.words, addresses: {}, funded: [], total: 0, failed: 0, error: null };
  const check = await validateMnemonic(entry.phrase);
  if (!check.valid) return { ...base, status: "invalid", error: check.reason };

  let addresses = {};
  try {
    addresses = getAddresses(entry.phrase);
  } catch {
    return { ...base, status: "invalid", error: "Addresses could not be derived from this phrase." };
  }

  // TON wallet v4R2 only exists for 24-word phrases, so other lengths skip it.
  const scanned = scanAssets.filter((coin) => coin.chain !== "ton" || entry.words === 24);

  const reads = await Promise.all(
    scanned.map(async (coin) => {
      const price = priceOf(prices, coin);
      // Cardano holds funds on several base addresses for one phrase, so its
      // reader takes the whole list and totals them.
      const address = coin.chain === "cardano" ? cardanoAddresses(entry.phrase) : addresses[coin.chain] || "";
      // Public nodes rate-limit bursts, so a failed read is retried once before
      // it is reported as a failure — a chain is never silently counted as zero.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const balance = await readBalance(coin, address);
          return { coin, balance, price, failed: false };
        } catch {
          if (attempt === 1) break;
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
      return { coin, balance: 0, price, failed: true };
    }),
  );

  const funded = reads
    .filter((read) => read.balance > 0)
    .map((read) => ({
      id: read.coin.id,
      chain: read.coin.chain,
      symbol: read.coin.symbol,
      name: read.coin.name,
      color: read.coin.color,
      logo: read.coin.logo,
      balance: read.balance,
      value: read.balance * read.price,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    ...base,
    status: "done",
    addresses,
    funded,
    total: funded.reduce((sum, item) => sum + item.value, 0),
    failed: reads.filter((read) => read.failed).length,
    failedChains: reads.filter((read) => read.failed).map((read) => read.coin.symbol),
  };
}

/** Scans every phrase with a worker pool; reports progress as it goes. */
export async function scanPhrases(entries, { prices, onProgress, isCancelled, concurrency = 16, addressLimit = 4000 } = {}) {
  const results = new Array(entries.length).fill(null);
  let nextIndex = 0;
  let completed = 0;
  let emptyCount = 0;

  async function worker() {
    while (nextIndex < entries.length) {
      if (isCancelled?.()) return;
      const index = nextIndex;
      nextIndex += 1;
      const result = await scanOne(entries[index], prices);
      // Long runs drop the derived addresses of empty wallets: on a list of a
      // million phrases holding every address set would exhaust memory.
      if (result.status === "done" && !(result.total > 0)) {
        emptyCount += 1;
        if (emptyCount > addressLimit) result.addresses = {};
      }
      results[index] = result;
      completed += 1;
      onProgress?.({ completed, index, result });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, () => worker()));
  return results.filter(Boolean);
}