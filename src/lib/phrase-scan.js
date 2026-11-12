// Bulk recovery-phrase balance scanner. Everything runs on this device: phrases
// are only used to derive addresses, and only those addresses are sent to RPCs.
import { assets } from "@/lib/chains/config";
import { getAddresses } from "@/lib/chains/derive";
import { readBalance } from "@/lib/chains/portfolio";
import { priceOf } from "@/lib/chains/prices";
import { validateMnemonic } from "@/lib/bip39";

const SCAN_IDS = [
  "bitcoin",
  "ethereum",
  "bsc",
  "polygon",
  "solana",
  "tron",
  "litecoin",
  "avalanche",
  "usdt-eth",
  "usdc-eth",
  "usdt-bsc",
  "usdt-pol",
  "usdc-base",
];

// Not in the wallet catalog, but the most common balance on farmed wallets.
const extraAssets = [
  {
    id: "usdt-tron",
    kind: "token",
    family: "tron",
    chain: "tron",
    symbol: "USDT",
    name: "Tether USD (TRC-20)",
    address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    decimals: 6,
    coingecko: "tether",
    color: "#26A17B",
    logo: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/usdt.png",
  },
];

export const scanAssets = [
  ...SCAN_IDS.map((id) => assets.find((asset) => asset.id === id)).filter(Boolean),
  ...extraAssets,
];
export const scanChains = [...new Set(scanAssets.map((asset) => asset.chain))];

const WORD_COUNTS = [12, 15, 18, 21, 24];

function stripLabel(line) {
  let value = line.trim();
  const colon = value.lastIndexOf(":");
  if (colon > -1) {
    const after = value.slice(colon + 1).trim();
    if (after.split(/\s+/).filter(Boolean).length >= 12) value = after;
  }
  value = value.replace(/^(?:wallet|phrase|seed|account|acct)\s*#?\s*\d*\s*[-–:.]?\s*/i, "");
  value = value.replace(/^\d+\s*[).:-]?\s+/, "");
  return value.trim();
}

function normalise(line) {
  return stripLabel(line).replace(/\s+/g, " ").trim();
}

const wordCountOf = (line) => normalise(line).split(" ").filter(Boolean).length;

/** Splits pasted text or a .txt file into individual recovery phrases. */
export function parsePhrases(text) {
  const cleaned = String(text || "")
    .replace(/\r/g, "")
    .replace(/[.,;|]/g, " ")
    .replace(/[–—]/g, " ");

  const blocks = cleaned
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const candidates = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const phraseLines = lines.filter((line) => WORD_COUNTS.includes(wordCountOf(line)));
    if (lines.length > 1 && phraseLines.length > 0 && phraseLines.length >= lines.length / 2) {
      candidates.push(...phraseLines);
    } else {
      candidates.push(lines.join(" "));
    }
  }

  const seen = new Set();
  const entries = [];
  for (const candidate of candidates) {
    const phrase = normalise(candidate);
    if (!phrase) continue;
    const key = phrase.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ phrase, words: phrase.split(" ").length });
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

  const reads = await Promise.all(
    scanAssets.map(async (coin) => {
      const price = priceOf(prices, coin);
      try {
        const balance = await readBalance(coin, addresses[coin.chain] || "");
        return { coin, balance, price, failed: false };
      } catch {
        return { coin, balance: 0, price, failed: true };
      }
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
  };
}

/** Scans every phrase with a small worker pool; reports progress as it goes. */
export async function scanPhrases(entries, { prices, onProgress, isCancelled, concurrency = 4 } = {}) {
  const results = new Array(entries.length).fill(null);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < entries.length) {
      if (isCancelled?.()) return;
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await scanOne(entries[index], prices);
      completed += 1;
      onProgress?.({ completed, index, result: results[index] });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, () => worker()));
  return results.filter(Boolean);
}