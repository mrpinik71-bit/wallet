// SAMPLE DATA — reference prices and placeholder balances used while the wallet
// is not yet connected to live network balances.

import { coins, networkOf } from "@/lib/coin-catalog";

function spark(seed, trend) {
  const points = [];
  let value = 50;
  for (let i = 0; i < 12; i += 1) {
    const wave = Math.sin((seed + 1) * (i + 1) * 1.7) * 6;
    value = Math.max(8, Math.min(96, value + wave + trend * 1.6));
    points.push(Number(value.toFixed(1)));
  }
  return points;
}

const holdings = [
  ["btc", 0.4821],
  ["eth", 4.82],
  ["sol", 62.4],
  ["usdt-tron", 12480.5],
  ["bnb", 18.4],
  ["ton", 640],
  ["pol", 8400],
  ["trx", 12400],
];

export const assets = holdings.map(([id, amount]) => {
  const coin = coins.find((item) => item.id === id);
  return { ...coin, chain: networkOf(coin).name, amount };
});

export const markets = coins.map((coin, index) => ({
  ...coin,
  chain: networkOf(coin).name,
  spark: spark(index, coin.change7d),
}));

export const portfolioHistory = [
  { label: "Oct 14", value: 141220 },
  { label: "Oct 16", value: 138940 },
  { label: "Oct 18", value: 145610 },
  { label: "Oct 20", value: 143180 },
  { label: "Oct 22", value: 151420 },
  { label: "Oct 24", value: 149760 },
  { label: "Oct 26", value: 156980 },
  { label: "Oct 28", value: 154210 },
  { label: "Oct 30", value: 161540 },
  { label: "Nov 1", value: 158320 },
  { label: "Nov 3", value: 164870 },
  { label: "Nov 5", value: 169140 },
  { label: "Nov 7", value: 166220 },
  { label: "Nov 9", value: 173980 },
  { label: "Nov 11", value: 178410 },
  { label: "Nov 12", value: 182940 },
];

export const transactions = [
  {
    id: "tx-1",
    type: "receive",
    asset: "ETH",
    amount: 1.25,
    valueUsd: 4265.69,
    counterparty: "0x7Af4…91Cc",
    chain: "Ethereum",
    status: "confirmed",
    timestamp: "2026-11-12T08:42:00Z",
  },
  {
    id: "tx-2",
    type: "swap",
    asset: "SOL → USDT",
    amount: 12.0,
    valueUsd: 2578.56,
    counterparty: "Jupiter",
    chain: "Solana",
    status: "confirmed",
    timestamp: "2026-11-11T19:10:00Z",
  },
  {
    id: "tx-3",
    type: "send",
    asset: "USDT",
    amount: 480.0,
    valueUsd: 480.0,
    counterparty: "TQ5n…8pQr",
    chain: "TRON",
    status: "confirmed",
    timestamp: "2026-11-11T11:04:00Z",
  },
  {
    id: "tx-4",
    type: "receive",
    asset: "BTC",
    amount: 0.0421,
    valueUsd: 4053.57,
    counterparty: "bc1q…k7vt",
    chain: "Bitcoin",
    status: "confirmed",
    timestamp: "2026-11-10T06:26:00Z",
  },
  {
    id: "tx-5",
    type: "send",
    asset: "TON",
    amount: 84.0,
    valueUsd: 524.16,
    counterparty: "UQAi…7pQk",
    chain: "TON",
    status: "pending",
    timestamp: "2026-11-09T21:58:00Z",
  },
  {
    id: "tx-6",
    type: "swap",
    asset: "POL → ETH",
    amount: 2400,
    valueUsd: 1228.8,
    counterparty: "1inch",
    chain: "Polygon",
    status: "confirmed",
    timestamp: "2026-11-08T14:32:00Z",
  },
];

export const featuredApps = [
  { name: "Uniswap", category: "DEX", chain: "Ethereum", blurb: "Swap tokens across deep liquidity pools.", url: "https://app.uniswap.org", color: "#FF3E8F" },
  { name: "Jupiter", category: "DEX", chain: "Solana", blurb: "Best-route swaps on Solana.", url: "https://jup.ag", color: "#14F195" },
  { name: "PancakeSwap", category: "DEX", chain: "BNB Chain", blurb: "The largest DEX on BNB Smart Chain.", url: "https://pancakeswap.finance", color: "#1FC7D4" },
  { name: "STON.fi", category: "DEX", chain: "TON", blurb: "Native swaps inside The Open Network.", url: "https://ston.fi", color: "#0098EA" },
  { name: "Aave", category: "Lending", chain: "Multichain", blurb: "Supply and borrow across chains.", url: "https://app.aave.com", color: "#B6509E" },
  { name: "OpenSea", category: "NFT", chain: "Multichain", blurb: "Trade collectibles and digital art.", url: "https://opensea.io", color: "#2081E2" },
];

export function totalBalance() {
  return assets.reduce((sum, item) => sum + item.price * item.amount, 0);
}