import { entriesFromList, scanPhraseStream, scanAssets } from "@/lib/phrase-scan";

const PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Records every TRON request the real scan makes and what the wallet reports.
export default async function run() {
  const realFetch = globalThis.fetch;
  const tron = [];
  globalThis.fetch = async (url, options) => {
    const text = String(url?.url || url);
    if (/tron/i.test(text)) tron.push(text.replace(/^https?:\/\/[^/]+/, "").slice(0, 60));
    return realFetch(url, options);
  };
  const results = [];
  try {
    await scanPhraseStream(entriesFromList([{ phrase: PHRASE, words: 12, line: 1 }]), {
      accounts: 3,
      prices: {},
      onResult: (result) => results.push(result),
    });
  } finally {
    globalThis.fetch = realFetch;
  }
  return {
    tronRequests: tron.length,
    tronPaths: [...new Set(tron)],
    rows: results.map((row) => ({
      account: row.account,
      tron: row.addresses?.tron || null,
      ton: row.addresses?.ton || null,
      usdt: (row.funded || []).filter((item) => item.symbol === "USDT").map((item) => `${item.chain}:${item.balance}`),
      failedChains: row.failedChains,
    })),
  };
}