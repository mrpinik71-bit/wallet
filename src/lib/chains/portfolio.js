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
import { changeOf, fetchPrices, priceOf } from "@/lib/chains/prices";

export async function readBalance(coin, address) {
  if (!address) return 0;
  if (coin.family === "evm") {
    return coin.kind === "token" ? evmTokenBalance(coin.chain, address, coin) : evmNativeBalance(coin.chain, address);
  }
  if (coin.family === "utxo") return utxoBalance(coin.chain, address);
  if (coin.family === "blockcypher") return blockcypherBalance(coin.chain, address);
  if (coin.family === "xrp") return xrpBalance(address);
  if (coin.family === "cardano") return cardanoBalance(address);
  if (coin.family === "polkadot") return polkadotBalance(address);
  if (coin.family === "aptos") return aptosBalance(address);
  if (coin.family === "near") return nearBalance(address);
  if (coin.family === "ton") return tonBalance(address);
  if (coin.family === "sui") return suiBalance(address);
  if (coin.family === "solana") return solanaBalance(address);
  if (coin.chain === "tron") {
    return coin.kind === "token" ? trc20Balance(address, coin) : tronBalance(address);
  }
  return 0;
}

export async function loadPortfolio(mnemonic, account = 0) {
  const addresses = getAddresses(mnemonic, account);
  const prices = await fetchPrices();

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

  const ordered = [...holdings].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
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