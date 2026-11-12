// USD prices and 24h changes for the assets this wallet supports.
import { assets } from "@/lib/chains/config";
import { coins as catalog } from "@/lib/coin-catalog";

const cache = new Map();

async function load(ids) {
  const key = ids.join(",");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60000) return hit.data;
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${key}&vs_currencies=usd&include_24hr_change=true`,
    );
    if (!response.ok) throw new Error("price feed unavailable");
    const data = await response.json();
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return hit?.data || {};
  }
}

const idsOf = (list) => [...new Set(list.map((asset) => asset.coingecko).filter(Boolean))].sort();

export async function fetchPrices() {
  return load(idsOf(assets));
}

/** Prices for any asset list, e.g. the wider catalog used by the bulk scanner. */
export async function fetchPricesFor(list) {
  return load(idsOf(list));
}

export function priceOf(prices, coin) {
  const live = prices?.[coin.coingecko]?.usd;
  if (typeof live === "number") return live;
  const fallback = catalog.find((item) => item.symbol.toUpperCase() === coin.symbol.toUpperCase());
  return fallback?.price ?? 0;
}

export function changeOf(prices, coin) {
  const live = prices?.[coin.coingecko]?.usd_24h_change;
  if (typeof live === "number") return live;
  const fallback = catalog.find((item) => item.symbol.toUpperCase() === coin.symbol.toUpperCase());
  return fallback?.change24h ?? 0;
}