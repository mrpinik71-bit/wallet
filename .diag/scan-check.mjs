import { scanPhrases } from "@/lib/chains/scan-pipeline";
import { fetchPrices } from "@/lib/chains/prices";

const PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

export default async function run() {
  const prices = await fetchPrices().catch(() => null);
  const results = [];
  await scanPhrases([{ phrase: PHRASE, line: 1 }], {
    prices,
    accounts: 1,
    onResult: (result) => results.push(result),
  });
  const errors = globalThis.__scanErr || {};
  const first = results[0] || {};
  return {
    tronAddress: first.addresses?.tron,
    failed: first.failed,
    failedChains: first.failedChains,
    funded: (first.funded || []).map((f) => `${f.chain} ${f.symbol} ${f.balance}`),
    errorKeys: Object.entries(errors).slice(0, 25),
  };
}