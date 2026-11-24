import { generateMnemonic } from "@/lib/bip39";
import { scanPhrases } from "@/lib/chains/scan-pipeline";
import { fetchPrices } from "@/lib/chains/prices";

async function main() {
  const phrases = [];
  for (let i = 0; i < 40; i += 1) phrases.push({ phrase: await generateMnemonic(12), line: i + 1 });
  const prices = await fetchPrices().catch(() => null);
  const t0 = Date.now();
  let first = 0, done = 0, failedTotal = 0;
  const failedChains = {};
  await scanPhrases(phrases, {
    prices,
    accounts: 1,
    onResult: (r) => {
      done += 1;
      if (!first) first = Date.now() - t0;
      failedTotal += r.failed || 0;
      for (const c of r.failedChains || []) failedChains[c] = (failedChains[c] || 0) + 1;
    },
  });
  const top = Object.entries(failedChains).sort((a, b) => b[1] - a[1]).slice(0, 12);
  console.log(JSON.stringify({ wallets: done, firstResultMs: first, totalMs: Date.now() - t0, failedReads: failedTotal, topFailedChains: top }, null, 1));
  process.exit(0);
}
main();