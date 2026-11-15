// Diagnostic: scans N fresh 12-word phrases and reports per-chain read failures.
import { generateMnemonic } from "@/lib/bip39";
import { scanPhrases } from "@/lib/chains/scan-pipeline";
import { fetchPrices } from "@/lib/chains/prices";

async function main() {
  const N = Number(process.env.N || 250);
  const started = Date.now();

  const entries = [];
  for (let i = 0; i < N; i += 1) entries.push({ phrase: await generateMnemonic(12), words: 12, line: i + 1 });

  async function* source() {
    for (const entry of entries) yield entry;
  }

  const prices = await fetchPrices().catch(() => ({}));
  let done = 0;
  const counts = {};
  let failed = 0;
  let lastLog = 0;

  await scanPhrases(source(), {
    prices,
    onResult: (result) => {
      done += 1;
      const chains = result.failedChains || [];
      if (chains.length) failed += 1;
      for (const symbol of chains) counts[symbol] = (counts[symbol] || 0) + 1;
      const elapsed = Math.round((Date.now() - started) / 1000);
      if (elapsed - lastLog >= 20) {
        lastLog = elapsed;
        console.log(`progress ${done}/${N} at ${elapsed}s`);
      }
    },
  });

  const seconds = Math.round((Date.now() - started) / 1000);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log("ERRORS", globalThis.__scanErr || {});
  console.log(
    JSON.stringify(
      {
        wallets: done,
        seconds,
        walletsWithAnyFailedChain: failed,
        failedChainCounts: Object.fromEntries(sorted),
      },
      null,
      1,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});