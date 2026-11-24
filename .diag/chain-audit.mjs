// Per-chain audit: for a handful of wallets, ask every catalog chain and record
// how long it took and whether it answered. Relative relay routes are sent to
// the published app, so the real production path is what gets measured.
import { generateMnemonic } from "@/lib/bip39";
import { prepare } from "@/lib/chains/scan-derive";
import { SCAN_ASSETS } from "@/lib/chains/scan-catalog";
import { chains } from "@/lib/chains/config";
import { endpointsFor } from "@/lib/chains/mirrors";
import { readBalance } from "@/lib/chains/portfolio";
import { evmChainBalancesMany } from "@/lib/chains/scan-batch";
import {
  cardanoBalancesMany,
  polkadotAssetBalancesMany,
  polkadotBalancesMany,
  solanaBalancesMany,
  solanaTokenBalancesMany,
  suiBalancesMany,
} from "@/lib/chains/scan-batch-multi";

const ORIGIN = "https://glorious-vault-chain-core.base44.app";
const rawFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === "string" ? input : input?.url;
  if (typeof url === "string" && url.startsWith("/")) return rawFetch(ORIGIN + url, init);
  return rawFetch(input, init);
};

async function main() {
const WALLETS = 3;
const wallets = [];
for (let i = 0; i < WALLETS; i += 1) {
  const raw = await generateMnemonic(12);
  const phrase = Array.isArray(raw) ? raw.join(" ") : raw;
  wallets.push(prepare({ phrase, words: 12, line: i + 1 }));
}

const chainsInCatalog = [...new Set(SCAN_ASSETS.map((c) => c.chain))];
const rows = [];

async function timed(fn) {
  const started = Date.now();
  try {
    const value = await fn();
    return { ms: Date.now() - started, ok: true, value };
  } catch (error) {
    return { ms: Date.now() - started, ok: false, error: String(error?.message || error).slice(0, 80) };
  }
}

for (const chainId of chainsInCatalog) {
  const coins = SCAN_ASSETS.filter((c) => c.chain === chainId);
  const addresses = wallets.map((w) => w.addresses?.[chainId]).filter(Boolean);
  if (!addresses.length) {
    rows.push({ chain: chainId, ms: 0, ok: false, error: "no address derived" });
    continue;
  }
  const host = (() => {
    try {
      return new URL(chains[chainId]?.rpc || chains[chainId]?.api || "").host;
    } catch {
      return "n/a";
    }
  })();

  let result;
  if (coins.some((c) => c.family === "evm")) {
    result = await timed(() => evmChainBalancesMany(chainId, addresses, coins));
  } else if (chainId === "solana") {
    result = await timed(() => solanaBalancesMany(addresses));
  } else if (chainId === "sui") {
    result = await timed(() => suiBalancesMany(addresses));
  } else if (chainId === "polkadot") {
    result = await timed(() => polkadotBalancesMany(addresses));
  } else if (chainId === "cardano") {
    result = await timed(() => cardanoBalancesMany(wallets.map((w) => w.cardano).filter(Boolean)));
  } else {
    const coin = coins[0];
    const endpoints = endpointsFor(chainId, chains[chainId]?.rpc || chains[chainId]?.api);
    result = await timed(() => readBalance(coin, addresses[0], endpoints[0]));
  }
  rows.push({ chain: chainId, host, coins: coins.length, ...result });
}

// Token-only chains on the multi-address readers (USDT/USDC and the like).
for (const chainId of ["sui", "polkadot", "solana"]) {
  for (const coin of SCAN_ASSETS.filter((c) => c.chain === chainId && c.kind === "token")) {
    const addresses = wallets.map((w) => w.addresses?.[chainId]).filter(Boolean);
    const read =
      chainId === "polkadot"
        ? () => polkadotAssetBalancesMany(addresses, coin.address, coin.decimals)
        : chainId === "solana"
          ? () => solanaTokenBalancesMany(addresses, coin.address, coin.decimals)
          : () => suiBalancesMany(addresses, coin.address, coin.decimals);
    const result = await timed(read);
    rows.push({ chain: `${chainId}:${coin.symbol}`, host: "token", coins: 1, ...result });
  }
}

const failures = rows.filter((r) => !r.ok);
const slowest = rows.slice().sort((a, b) => b.ms - a.ms).slice(0, 8);
console.log(JSON.stringify({ tested: rows.length, failed: failures.length, failures, slowest, all: rows.map(({ chain, ms, ok, error }) => ({ chain, ms, ok, error })) }, null, 1));
}

main().catch((error) => {
  console.error("audit failed:", error);
  process.exit(1);
});