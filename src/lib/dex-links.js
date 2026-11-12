// Where a swap for a given asset pair actually executes. The wallet keeps the
// keys; the DEX handles liquidity and routing.
const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const uniswapChains = {
  ethereum: "mainnet",
  bsc: "bsc",
  polygon: "polygon",
  arbitrum: "arbitrum",
  optimism: "optimism",
  base: "base",
  avalanche: "avalanche",
  celo: "celo",
};

const currency = (coin) => (coin.kind === "token" ? coin.address : NATIVE);

export function dexSwapLink(from, to) {
  if (!from || !to || from.chain !== to.chain || from.id === to.id) return null;

  const chain = uniswapChains[from.chain];
  if (chain) {
    return {
      name: "Uniswap",
      url: `https://app.uniswap.org/swap?chain=${chain}&inputCurrency=${currency(from)}&outputCurrency=${currency(to)}`,
    };
  }
  if (from.chain === "solana") {
    return { name: "Jupiter", url: `https://jup.ag/swap/${from.symbol}-${to.symbol}` };
  }
  if (from.chain === "tron") {
    return { name: "SunSwap", url: "https://sunswap.com/#/v2/swap" };
  }
  return null;
}