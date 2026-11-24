// Diagnostic: runs the real scan against a few fresh phrases through the
// published app's /api relays, and reports which chains were reported failed.
import { generateMnemonic } from "@/lib/bip39";
import { scanPhrases } from "@/lib/chains/scan-pipeline";
import { fetchPrices } from "@/lib/chains/prices";

const ORIGIN = "https://glorious-vault-chain-core.base44.app";
const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === "string" ? input : input?.url;
  if (typeof url === "string" && url.startsWith("/")) return realFetch(ORIGIN + url, init);
  return realFetch(input, init);
};

async function main() {
  const N = Number(process.env.N || 4);
  const entries = [];
  for (let i = 0; i < N; i += 1) entries.push({ phrase: await generateMnemonic(12), words: 12, line: i + 1 });

  async function* source() {
    for (const entry of entries) yield entry;
  }

  const prices = await fetchPrices().catch(() => ({}));
  const counts = {};
  const results = [];
  const started = Date.now();

  await scanPhrases(source(), {
    prices,
    onResult: (result) => {
      results.push({ line: result.line, total: result.total, failed: result.failed, failedChains: result.failedChains });
      for (const symbol of result.failedChains || []) counts[symbol] = (counts[symbol] || 0) + 1;
      if (process.env.VERBOSE) {
        console.log(
          `${Math.round((Date.now() - started) / 1000)}s line ${result.line} failed=[${(result.failedChains || []).join(",")}]`,
        );
      }
    },
  });

  console.log(
    JSON.stringify(
      {
        seconds: Math.round((Date.now() - started) / 1000),
        failedBySymbol: counts,
        results,
        errors: Object.entries(globalThis.__scanErr || {}).map(([key, value]) => `${key} x${value}`),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});