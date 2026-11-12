// USD prices and 24h changes for the assets this wallet supports.
import { assets } from "@/lib/chains/config";
import { coins as catalog } from "@/lib/coin-catalog";

let cache = { at: 0, data: {} };

export async function fetchPrices() {
  if (Date.now() - cache.at < 60000) return cache.data;
  const ids = [...new Set(assets.map((asset) => asset.coingecko).filter(Boolean))];
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`,
    );
    if (!response.ok) throw new Error("price feed unavailable");
    const data = await response.json();
    cache = { at: Date.now(), data };
    return data;
  } catch {
    return cache.data;
  }
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