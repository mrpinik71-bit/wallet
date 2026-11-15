import { scanPhrases } from "@/lib/chains/scan-pipeline";
const phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
async function* source() { yield { phrase, words: 12, line: 1 }; }
(async () => {
  const out = [];
  await scanPhrases(source(), { prices: {}, onResult: (r) => out.push(r) });
  const r = out[0];
  console.log(JSON.stringify({ addresses: r.addresses, funded: r.funded.length, failedChains: r.failedChains }, null, 1));
})();
