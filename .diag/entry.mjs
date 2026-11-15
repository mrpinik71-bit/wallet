import { scanPhrases } from "@/lib/chains/scan-pipeline";
const base = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const N = Number(process.env.N || 100);
async function* source() { for (let i = 0; i < N; i += 1) yield { phrase: base, words: 12, line: i + 1 }; }
(async () => {
  const out = [];
  const t0 = Date.now();
  await scanPhrases(source(), { prices: {}, onResult: (r) => out.push(r) });
  const chains = {};
  out.forEach((r) => (r.failedChains || []).forEach((c) => (chains[c] = (chains[c] || 0) + 1)));
  console.log(JSON.stringify({ wallets: out.length, seconds: Math.round((Date.now() - t0) / 1000), withFailures: out.filter((r) => r.failed).length, failedChainCounts: chains }, null, 1));
})();