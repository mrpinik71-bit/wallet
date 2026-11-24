// Diagnostic: how long ONE wallet's address derivation takes on this CPU,
// measured across the chains the scanner reads.
import { generateMnemonic } from "@/lib/bip39";
import { prepare } from "@/lib/chains/scan-derive";

async function main() {
  const N = Number(process.env.N || 20);
  const entries = [];
  for (let i = 0; i < N; i += 1) entries.push({ phrase: await generateMnemonic(12), words: 12, line: i + 1 });

  // one warm-up, so the first-call JIT cost is not counted as throughput
  const started = Date.now();
  prepare(entries[0]);
  const firstMs = Date.now() - started;

  const t0 = Date.now();
  let ok = 0;
  for (const entry of entries) {
    const wallet = prepare(entry);
    if (wallet && !wallet.invalid) ok += 1;
  }
  const seconds = (Date.now() - t0) / 1000;
  console.log(
    JSON.stringify(
      {
        wallets: N,
        valid: ok,
        firstWalletMs: firstMs,
        seconds: Number(seconds.toFixed(2)),
        msPerWallet: Math.round((seconds * 1000) / N),
        walletsPerMinuteOneCore: Math.round((N / seconds) * 60),
      },
      null,
      1,
    ),
  );
}

main();