// Diagnostic: reads the catalog tokens through the scanner's own batched reader.
import { evmChainBalancesMany } from "@/lib/chains/scan-batch";
import { SCAN_ASSETS } from "@/lib/chains/scan-catalog";

const WALLETS = {
  ethereum: ["0x5754284f345afc66a98fbB0a0Afe71e0F007B949"],
  bsc: ["0x8894E0a0c962CB723c1976a4421c95949bE2D4E3"],
};

async function main() {
  const out = {};
  for (const [chain, addresses] of Object.entries(WALLETS)) {
    const coins = SCAN_ASSETS.filter((coin) => coin.chain === chain);
    const started = Date.now();
    try {
      const values = await evmChainBalancesMany(chain, addresses, coins);
      const entry = values.get(0) || new Map();
      out[chain] = {
        ms: Date.now() - started,
        coins: coins.length,
        read: entry.size,
        balances: coins.map((coin) => [coin.symbol, entry.has(coin.id) ? entry.get(coin.id) : "MISSING"]),
      };
    } catch (error) {
      out[chain] = { error: String(error?.message).slice(0, 120), ms: Date.now() - started };
    }
  }
  console.log(JSON.stringify(out, null, 1));
}

main();