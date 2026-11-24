import { scanPhrases } from "@/lib/chains/scan-pipeline";

async function main() {
  const phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const results = [];
  await scanPhrases([{ phrase, words: 12, line: 1 }], {
    prices: {},
    accounts: 1,
    onResult: (r) => results.push({ status: r.status, failed: r.failed, failedChains: r.failedChains, funded: r.funded?.map((f) => `${f.chain}:${f.symbol}=${f.balance}`) }),
    onProgress: () => {},
  });
  const errs = Object.entries(globalThis.__scanErr || {})
    .filter(([k]) => k.startsWith("tron|"))
    .map(([k, v]) => `${k} x${v}`);
  console.log(JSON.stringify({ results, tronErrors: errs }, null, 1));
}
main();
