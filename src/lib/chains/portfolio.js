// Reads live balances for every supported asset from its chain.
import { assets } from "@/lib/chains/config";
import { getAddresses } from "@/lib/chains/derive";
import { evmNativeBalance, evmTokenBalance } from "@/lib/chains/evm";
import { utxoBalance } from "@/lib/chains/utxo";
import { solanaBalance } from "@/lib/chains/solana";
import { tronBalance, trc20Balance } from "@/lib/chains/tron";
import {
  aptosBalance,
  blockcypherBalance,
  cardanoBalance,
  nearBalance,
  polkadotBalance,
  suiBalance,
  tonBalance,
  xrpBalance,
} from "@/lib/chains/scan-read";
import { stacksBalance } from "@/lib/chains/stacks";
import { babylonBalance } from "@/lib/chains/babylon";
import { changeOf, fetchPrices, priceOf } from "@/lib/chains/prices";
import { colorForToken, discoverTokens, DISCOVERY_NETWORKS } from "@/lib/chains/token-discovery";

export async function readBalance(coin, address, endpoint) {
  if (!address) return 0;
  if (coin.family === "evm") {
    return coin.kind === "token" ? evmTokenBalance(coin.chain, address, coin) : evmNativeBalance(coin.chain, address);
  }
  // `endpoint` is only passed by the bulk scan, which spreads its burst over
  // every mirror of a chain; the wallet itself always uses the configured one.
  if (coin.family === "utxo") return utxoBalance(coin.chain, address, endpoint);
  if (coin.family === "blockcypher") return blockcypherBalance(coin.chain, address);
  if (coin.family === "xrp") return xrpBalance(address, endpoint);
  if (coin.family === "cardano") return cardanoBalance(address);
  if (coin.family === "polkadot") return polkadotBalance(address);
  if (coin.family === "aptos") return aptosBalance(address);
  if (coin.family === "near") return nearBalance(address);
  if (coin.family === "ton") return tonBalance(address);
  if (coin.family === "sui") return suiBalance(address);
  if (coin.family === "solana") return solanaBalance(address);
  if (coin.family === "stacks") return stacksBalance(address);
  if (coin.family === "babylon") return babylonBalance(address);
  if (coin.chain === "tron") {
    return coin.kind === "token" ? trc20Balance(address, coin) : tronBalance(address);
  }
  return 0;
}

// An indexer that stops answering must not hold the whole portfolio back: a slow
// one is dropped for this read and the rest still show.
const SETTLE_MS = 6000;
const settle = (work) =>
  Promise.race([work, new Promise((resolve) => setTimeout(() => resolve([]), SETTLE_MS))]);

async function discoverHeld(addresses, known) {
  const found = await Promise.all(
    DISCOVERY_NETWORKS.map(async (chainId) => {
      try {
        const tokens = await settle(discoverTokens(chainId, addresses[chainId]));
        return tokens.map((token) => ({ ...token, chain: chainId }));
      } catch {
        return [];
      }
    }),
  );

  const list = [];
  for (const token of found.flat()) {
    const key = `${token.chain}|${token.address.toLowerCase()}`;
    if (known.has(key)) continue;
    known.add(key);
    list.push({
      id: `token-${token.chain}-${token.address.toLowerCase()}`,
      kind: "token",
      family: "evm",
      chain: token.chain,
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      decimals: token.decimals,
      balance: token.balance,
      price: 0,
      change24h: 0,
      value: 0,
      changeValue: 0,
      color: colorForToken(token.symbol),
      logo: token.logo,
      discovered: true,
      error: null,
    });
  }
  return list;
}

export async function loadPortfolio(mnemonic, account = 0) {
  const addresses = getAddresses(mnemonic, account);
  const prices = await fetchPrices();

  // Tokens this wallet already knows about, so discovery only adds the rest.
  const known = new Set(
    assets
      .filter((coin) => coin.kind === "token" && coin.address)
      .map((coin) => `${coin.chain}|${coin.address.toLowerCase()}`),
  );

  // Discovery runs alongside the balance reads instead of after them: it asks a
  // different set of indexers, so doing the two in turn only added their
  // latencies together.
  const discoveredTask = discoverHeld(addresses, known);

  const holdings = await Promise.all(
    assets.map(async (coin) => {
      const address = addresses[coin.chain] || "";
      let balance = 0;
      let error = null;
      try {
        balance = await readBalance(coin, address);
      } catch (cause) {
        error = cause?.message || "Balance unavailable";
      }
      const price = priceOf(prices, coin);
      const change24h = changeOf(prices, coin);
      const value = balance * price;
      return {
        ...coin,
        address,
        balance,
        price,
        change24h,
        value,
        changeValue: (value * change24h) / 100,
        error,
      };
    }),
  );

  // Anything else sitting on the address — airdrops, meme tokens — is added as
  // an unpriced holding, after the assets this wallet already knows.
  const discovered = await discoveredTask;

  const ordered = [...holdings, ...discovered].sort(
    (a, b) =>
      b.value - a.value ||
      Number(Boolean(a.discovered)) - Number(Boolean(b.discovered)) ||
      a.name.localeCompare(b.name),
  );
  const total = ordered.reduce((sum, item) => sum + item.value, 0);
  const changeValue = ordered.reduce((sum, item) => sum + item.changeValue, 0);

  return {
    holdings: ordered,
    addresses,
    total,
    changeValue,
    changePct: total ? (changeValue / total) * 100 : 0,
  };
}