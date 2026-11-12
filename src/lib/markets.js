// Live market data for the assets this wallet supports, read from CoinGecko's
// public API. Results are cached briefly so several screens share one call.
import { networks } from "@/lib/coin-catalog";

const API = "https://api.coingecko.com/api/v3";
const TTL = 60_000;

// CoinGecko id → the network id used across the wallet.
const catalog = [
  { id: "bitcoin", network: "bitcoin" },
  { id: "ethereum", network: "ethereum" },
  { id: "binancecoin", network: "bsc" },
  { id: "solana", network: "solana" },
  { id: "tron", network: "tron" },
  { id: "the-open-network", network: "ton" },
  { id: "dogecoin", network: "dogecoin" },
  { id: "litecoin", network: "litecoin" },
  { id: "ripple", network: "xrp" },
  { id: "cardano", network: "cardano" },
  { id: "bitcoin-cash", network: "bitcoin-cash" },
  { id: "chainlink", network: "ethereum" },
  { id: "polkadot", network: "polkadot" },
  { id: "avalanche-2", network: "avalanche" },
  { id: "polygon-ecosystem-token", network: "polygon" },
  { id: "tether", network: "ethereum" },
  { id: "usd-coin", network: "ethereum" },
  { id: "dai", network: "ethereum" },
  { id: "pepe", network: "ethereum" },
  { id: "shiba-inu", network: "ethereum" },
  { id: "uniswap", network: "ethereum" },
  { id: "arbitrum", network: "arbitrum" },
  { id: "optimism", network: "optimism" },
  { id: "sui", network: "sui" },
  { id: "aptos", network: "aptos" },
  { id: "near", network: "near" },
  { id: "hedera-hashgraph", network: "hedera" },
  { id: "stellar", network: "stellar" },
  { id: "cosmos", network: "cosmos" },
  { id: "algorand", network: "algorand" },
  { id: "vechain", network: "vechain" },
  { id: "filecoin", network: "filecoin" },
  { id: "monero", network: "monero" },
  { id: "ethereum-classic", network: "ethereum-classic" },
  { id: "kaspa", network: "kaspa" },
  { id: "stacks", network: "stacks" },
  { id: "sei-network", network: "sei" },
  { id: "injective-protocol", network: "injective" },
  { id: "celestia", network: "celestia" },
  { id: "tezos", network: "tezos" },
  { id: "flow", network: "flow" },
  { id: "zcash", network: "zcash" },
  { id: "dash", network: "dash" },
  { id: "internet-computer", network: "icp" },
];

const networkById = Object.fromEntries(networks.map((item) => [item.id, item]));

export function networkLabel(networkId) {
  return networkById[networkId]?.name || networkId || "—";
}

export function networkColor(networkId) {
  return networkById[networkId]?.color || "#8A92B2";
}

let marketsCache = { at: 0, rows: null };
let globalsCache = { at: 0, data: null };

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Market data is unavailable right now.");
  return response.json();
}

const fresh = (entry) => entry.at && Date.now() - entry.at < TTL;

/** Live prices, 24h/7d changes, volume, market cap and a 7-day sparkline. */
export async function fetchMarkets({ force = false } = {}) {
  if (!force && fresh(marketsCache) && marketsCache.rows) return marketsCache.rows;
  const ids = catalog.map((item) => item.id).join(",");
  const raw = await getJson(
    `${API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d`,
  );
  const rows = (Array.isArray(raw) ? raw : []).map((row) => {
    const entry = catalog.find((item) => item.id === row.id);
    const network = entry?.network || "";
    return {
      id: row.id,
      symbol: (row.symbol || "").toUpperCase(),
      name: row.name,
      network,
      color: networkColor(network),
      logo: row.image,
      price: row.current_price ?? 0,
      change24h: row.price_change_percentage_24h_in_currency ?? 0,
      change7d: row.price_change_percentage_7d_in_currency ?? 0,
      volume: row.total_volume ?? 0,
      marketCap: row.market_cap ?? 0,
      rank: row.market_cap_rank ?? null,
      spark: row.sparkline_in_7d?.price || [],
    };
  });
  marketsCache = { at: Date.now(), rows };
  return rows;
}

/** Aggregate market cap, volume, BTC dominance and the fear & greed index. */
export async function fetchMarketGlobals({ force = false } = {}) {
  if (!force && fresh(globalsCache) && globalsCache.data) return globalsCache.data;
  const [global, sentiment] = await Promise.allSettled([
    getJson(`${API}/global`),
    getJson("https://api.alternative.me/fng/?limit=1"),
  ]);
  if (global.status === "rejected") throw global.reason;

  const data = global.value?.data || {};
  const greed = sentiment.status === "fulfilled" ? sentiment.value?.data?.[0] : null;
  const result = {
    marketCap: data.total_market_cap?.usd ?? 0,
    volume: data.total_volume?.usd ?? 0,
    btcDominance: data.market_cap_percentage?.btc ?? 0,
    marketCapChange: data.market_cap_change_percentage_24h_usd ?? 0,
    fearGreed: greed ? { value: Number(greed.value), label: greed.value_classification || "" } : null,
  };
  globalsCache = { at: Date.now(), data: result };
  return result;
}