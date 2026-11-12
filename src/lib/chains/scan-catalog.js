// Every network and asset the bulk scanner checks: all major chains, their
// native coins and the large tokens (worth more than $0.01) on each network.
import { chains } from "@/lib/chains/config";

const cdn = (symbol) => `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/${symbol.toLowerCase()}.png`;

const COINGECKO = {
  bitcoin: "bitcoin",
  ethereum: "ethereum",
  bsc: "binancecoin",
  polygon: "polygon-ecosystem-token",
  base: "ethereum",
  arbitrum: "ethereum",
  optimism: "ethereum",
  linea: "ethereum",
  scroll: "ethereum",
  zksync: "ethereum",
  polygonzkevm: "ethereum",
  unichain: "ethereum",
  avalanche: "avalanche-2",
  mantle: "mantle",
  celo: "celo",
  gnosis: "xdai",
  cronos: "crypto-com-chain",
  fantom: "fantom",
  sonic: "sonic-3",
  sei: "sei-network",
  berachain: "berachain-bera",
  kava: "kava",
  litecoin: "litecoin",
  dogecoin: "dogecoin",
  dash: "dash",
  solana: "solana",
  tron: "tron",
  xrp: "ripple",
  cardano: "cardano",
  polkadot: "polkadot",
  aptos: "aptos",
  near: "near",
};

const LOGO = {
  bitcoin: cdn("btc"),
  ethereum: cdn("eth"),
  bsc: cdn("bnb"),
  litecoin: cdn("ltc"),
  dogecoin: cdn("doge"),
  dash: cdn("dash"),
  tron: cdn("trx"),
  xrp: cdn("xrp"),
  cardano: cdn("ada"),
  polkadot: cdn("dot"),
  aptos: "https://assets.coingecko.com/coins/images/26455/large/aptos_round.png",
  near: "https://assets.coingecko.com/coins/images/10365/large/near.jpg",
  solana: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
  avalanche: "https://assets.coingecko.com/coins/images/12559/large/avax.png",
  polygon: "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
};

const native = (chainId) => {
  const chain = chains[chainId];
  return {
    id: chainId,
    kind: "native",
    family: chain.family,
    chain: chainId,
    symbol: chain.symbol,
    name: chain.name,
    decimals: chain.decimals || 18,
    color: chain.color,
    coingecko: COINGECKO[chainId],
    logo: LOGO[chainId],
  };
};

const token = (chain, id, symbol, name, address, decimals, coingecko, color, logo) => ({
  id,
  kind: "token",
  family: chains[chain].family,
  chain,
  symbol,
  name,
  address,
  decimals,
  coingecko,
  color,
  logo,
});

const TOKENS = [
  token("ethereum", "usdt-eth", "USDT", "Tether USD", "0xdAC17F958D2ee523a2206206994597C13D831ec7", 6, "tether", "#26A17B", cdn("usdt")),
  token("ethereum", "usdc-eth", "USDC", "USD Coin", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("ethereum", "dai-eth", "DAI", "Dai", "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18, "dai", "#F5AC37", cdn("dai")),
  token("ethereum", "link-eth", "LINK", "Chainlink", "0x514910771AF9Ca656af840dff83E8264EcF986CA", 18, "chainlink", "#2A5ADA", cdn("link")),
  token("ethereum", "uni-eth", "UNI", "Uniswap", "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", 18, "uniswap", "#FF007A", cdn("uni")),
  token("ethereum", "aave-eth", "AAVE", "Aave", "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", 18, "aave", "#B6509E"),
  token("ethereum", "shib-eth", "SHIB", "Shiba Inu", "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", 18, "shiba-inu", "#F00500"),
  token("ethereum", "pepe-eth", "PEPE", "Pepe", "0x6982508145454Ce325dDbE47a25d4ec3d2311933", 18, "pepe", "#3D8130"),
  token("ethereum", "wbtc-eth", "WBTC", "Wrapped Bitcoin", "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", 8, "wrapped-bitcoin", "#F7931A", cdn("btc")),

  token("bsc", "usdt-bsc", "USDT", "Tether USD (BEP-20)", "0x55d398326f99059fF775485246999027B3197955", 18, "tether", "#26A17B", cdn("usdt")),
  token("bsc", "usdc-bsc", "USDC", "USD Coin (BEP-20)", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", 18, "usd-coin", "#2775CA", cdn("usdc")),
  token("bsc", "cake-bsc", "CAKE", "PancakeSwap", "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", 18, "pancakeswap-token", "#633001"),
  token("bsc", "busd-bsc", "BUSD", "Binance USD", "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", 18, "binance-usd", "#F0B90B"),

  token("polygon", "usdt-pol", "USDT", "Tether USD (Polygon)", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", 6, "tether", "#26A17B", cdn("usdt")),
  token("polygon", "usdc-pol", "USDC", "USD Coin (Polygon)", "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", 6, "usd-coin", "#2775CA", cdn("usdc")),

  token("base", "usdc-base", "USDC", "USD Coin (Base)", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("base", "cbbtc-base", "cbBTC", "Coinbase Wrapped BTC", "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", 8, "coinbase-wrapped-btc", "#0052FF"),

  token("arbitrum", "usdc-arb", "USDC", "USD Coin (Arbitrum)", "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("arbitrum", "usdt-arb", "USDT", "Tether USD (Arbitrum)", "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", 6, "tether", "#26A17B", cdn("usdt")),
  token("arbitrum", "arb-arb", "ARB", "Arbitrum", "0x912CE59144191C1204E64559FE8253a0e49E6548", 18, "arbitrum", "#28A0F0"),

  token("optimism", "usdc-op", "USDC", "USD Coin (Optimism)", "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("optimism", "usdt-op", "USDT", "Tether USD (Optimism)", "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", 6, "tether", "#26A17B", cdn("usdt")),
  token("optimism", "op-op", "OP", "Optimism", "0x4200000000000000000000000000000000000042", 18, "optimism", "#FF0420"),

  token("avalanche", "usdc-avax", "USDC", "USD Coin (Avalanche)", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("avalanche", "usdt-avax", "USDT", "Tether USD (Avalanche)", "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", 6, "tether", "#26A17B", cdn("usdt")),

  token("celo", "usdc-celo", "USDC", "USD Coin (Celo)", "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", 6, "usd-coin", "#2775CA", cdn("usdc")),

  token("tron", "usdt-tron", "USDT", "Tether USD (TRC-20)", "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 6, "tether", "#26A17B", cdn("usdt")),
];

export const SCAN_ASSETS = [...Object.keys(COINGECKO).map(native), ...TOKENS];

export const SCAN_CHAINS = [...new Set(SCAN_ASSETS.map((asset) => asset.chain))];