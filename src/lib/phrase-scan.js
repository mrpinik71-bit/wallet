// Bulk recovery-phrase balance scanner. Everything runs on this device: phrases
// are only used to derive addresses, and only those addresses are sent to RPCs.
import { cardanoAddresses } from "@/lib/chains/cardano";
import { evmAddress, getAddresses } from "@/lib/chains/derive";
import { readBalance } from "@/lib/chains/portfolio";
import { priceOf } from "@/lib/chains/prices";
import { SCAN_ASSETS, SCAN_CHAINS } from "@/lib/chains/scan-catalog";
import { parsePhrases, phrasesFromLines } from "@/lib/phrase-lines";
import { readLines } from "@/lib/scan-file";

export const scanAssets = SCAN_ASSETS;
export const scanChains = SCAN_CHAINS;
export { parsePhrases };

async function scanOne(entry, prices) {
  const base = { phrase: entry.phrase, words: entry.words, addresses: {}, funded: [], total: 0, failed: 0, error: null };
  // A wallet exists for any phrase of a standard length: addresses derive from
  // the words alone, so a failed checksum must not hide a wallet that holds
  // funds. Only a line that cannot be a phrase at all is unreadable.
  const size = entry.words || entry.phrase.trim().split(/\s+/).length;
  if (![12, 15, 18, 21, 24].includes(size)) {
    return { ...base, status: "invalid", error: "A recovery phrase has 12 or 24 words." };
  }

  let addresses = {};
  try {
    addresses = getAddresses(entry.phrase);
  } catch {
    // One chain failing to derive must not hide the wallet: the EVM address
    // alone still shows funds on every EVM network.
    try {
      addresses = { ethereum: evmAddress(entry.phrase) };
    } catch {
      return { ...base, status: "invalid", error: "Addresses could not be derived from this phrase." };
    }
  }

  // TON wallet v4R2 only exists for 24-word phrases, so other lengths skip it.
  const scanned = scanAssets.filter((coin) => coin.chain !== "ton" || entry.words === 24);

  const reads = await Promise.all(
    scanned.map(async (coin) => {
      const price = priceOf(prices, coin);
      let address = addresses[coin.chain] || "";
      // Cardano holds funds on several base addresses for one phrase, so its
      // reader takes the whole list and totals them — and a failure there must
      // not take the whole wallet down with it.
      if (coin.chain === "cardano") {
        try {
          address = cardanoAddresses(entry.phrase);
        } catch {
          address = "";
        }
      }
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

const DEDUPE_LIMIT = 300000;

/** Reads a .txt file and streams its phrases, de-duplicated. */
export async function* phrasesFromFile(file, { onCount } = {}) {
  const seen = new Set();
  let count = 0;
  let reported = 0;

  for await (const phrase of phrasesFromLines(readLines(file))) {
    const key = phrase.toLowerCase();
    if (seen.has(key)) continue;
    // The de-duplication set is capped: past a few hundred thousand entries a
    // repeat is simply scanned again instead of exhausting browser memory.
    if (seen.size < DEDUPE_LIMIT) seen.add(key);
    count += 1;
    if (count - reported >= 5000) {
      reported = count;
      onCount?.(count);
    }
    yield { phrase, words: phrase.split(" ").length };
  }

  onCount?.(count);
}

/** Scans phrases as they stream in with a worker pool; reports each result. */
export async function scanPhraseStream(source, { prices, onResult, onProgress, isCancelled, concurrency = 8 } = {}) {
  let completed = 0;

  async function worker() {
    for await (const entry of source) {
      if (isCancelled?.()) return;
      // One phrase that throws must never end the whole run: it is reported
      // back and the scanner moves on to the next one.
      let result;
      try {
        result = await scanOne(entry, prices);
      } catch (cause) {
        result = {
          phrase: entry.phrase,
          words: entry.words,
          addresses: {},
          funded: [],
          total: 0,
          failed: 0,
          status: "invalid",
          error: cause?.message || "This phrase could not be checked.",
        };
      }
      completed += 1;
      onResult?.(result);
      onProgress?.({ completed, result });
    }
  }

  // Public nodes rate-limit bursts, so the pool stays at a fixed size.
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

/** Streams an in-memory list of entries (pasted text) through the same pool. */
export async function* entriesFromList(entries) {
  for (const entry of entries) yield entry;
}