// Live chain configuration: RPC endpoints + the assets this wallet actually
// derives addresses for, reads balances from and can broadcast transfers on.

const cdn = (symbol) =>
  `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/${symbol.toLowerCase()}.png`;
const cg = (id, file) => `https://assets.coingecko.com/coins/images/${id}/large/${file}`;

export const EVM_PATH = "m/44'/60'/0'/0/0";

/** Chain-level settings: family decides which adapter signs and broadcasts. */
export const chains = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    family: "evm",
    chainId: 1,
    rpc: "https://ethereum-rpc.publicnode.com",
    explorer: "https://etherscan.io",
    symbol: "ETH",
    color: "#627EEA",
  },
  bsc: {
    id: "bsc",
    name: "BNB Smart Chain",
    family: "evm",
    chainId: 56,
    rpc: "https://bsc-rpc.publicnode.com",
    explorer: "https://bscscan.com",
    symbol: "BNB",
    color: "#F3BA2F",
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    family: "evm",
    chainId: 137,
    rpc: "https://polygon-bor-rpc.publicnode.com",
    explorer: "https://polygonscan.com",
    symbol: "POL",
    color: "#8247E5",
  },
  base: {
    id: "base",
    name: "Base",
    family: "evm",
    chainId: 8453,
    rpc: "https://base-rpc.publicnode.com",
    explorer: "https://basescan.org",
    symbol: "ETH",
    color: "#0052FF",
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum One",
    family: "evm",
    chainId: 42161,
    rpc: "https://arbitrum-one-rpc.publicnode.com",
    explorer: "https://arbiscan.io",
    symbol: "ETH",
    color: "#28A0F0",
  },
  optimism: {
    id: "optimism",
    name: "Optimism",
    family: "evm",
    chainId: 10,
    rpc: "https://optimism-rpc.publicnode.com",
    explorer: "https://optimistic.etherscan.io",
    symbol: "ETH",
    color: "#FF0420",
  },
  avalanche: {
    id: "avalanche",
    name: "Avalanche",
    family: "evm",
    chainId: 43114,
    rpc: "https://avalanche-c-chain-rpc.publicnode.com",
    explorer: "https://snowtrace.io",
    symbol: "AVAX",
    color: "#E84142",
  },
  bitcoin: {
    id: "bitcoin",
    name: "Bitcoin",
    family: "utxo",
    api: "https://mempool.space/api",
    explorer: "https://mempool.space",
    hrp: "bc",
    path: "m/84'/0'/0'/0/0",
    symbol: "BTC",
    color: "#F7931A",
    decimals: 8,
  },
  litecoin: {
    id: "litecoin",
    name: "Litecoin",
    family: "utxo",
    api: "https://litecoinspace.org/api",
    explorer: "https://litecoinspace.org",
    hrp: "ltc",
    path: "m/84'/2'/0'/0/0",
    symbol: "LTC",
    color: "#345D9D",
    decimals: 8,
  },
  solana: {
    id: "solana",
    name: "Solana",
    family: "solana",
    rpc: "https://solana-rpc.publicnode.com",
    explorer: "https://solscan.io",
    path: "m/44'/501'/0'/0'",
    symbol: "SOL",
    color: "#14F195",
    decimals: 9,
  },
  tron: {
    id: "tron",
    name: "TRON",
    family: "tron",
    api: "https://api.trongrid.io",
    explorer: "https://tronscan.org",
    path: "m/44'/195'/0'/0/0",
    symbol: "TRX",
    color: "#EF0027",
    decimals: 6,
  },
  linea: {
    id: "linea",
    name: "Linea",
    family: "evm",
    chainId: 59144,
    rpc: "https://linea-rpc.publicnode.com",
    explorer: "https://lineascan.build",
    symbol: "ETH",
    color: "#61DFFF",
  },
  scroll: {
    id: "scroll",
    name: "Scroll",
    family: "evm",
    chainId: 534352,
    rpc: "https://scroll-rpc.publicnode.com",
    explorer: "https://scrollscan.com",
    symbol: "ETH",
    color: "#FFEEDA",
  },
  zksync: {
    id: "zksync",
    name: "zkSync Era",
    family: "evm",
    chainId: 324,
    rpc: "https://mainnet.era.zksync.io",
    explorer: "https://explorer.zksync.io",
    symbol: "ETH",
    color: "#8C8DFC",
  },
  mantle: {
    id: "mantle",
    name: "Mantle",
    family: "evm",
    chainId: 5000,
    rpc: "https://mantle-rpc.publicnode.com",
    explorer: "https://mantlescan.xyz",
    symbol: "MNT",
    color: "#16B7A8",
  },
  celo: {
    id: "celo",
    name: "Celo",
    family: "evm",
    chainId: 42220,
    rpc: "https://celo-rpc.publicnode.com",
    explorer: "https://celoscan.io",
    symbol: "CELO",
    color: "#FCFF52",
  },
  gnosis: {
    id: "gnosis",
    name: "Gnosis",
    family: "evm",
    chainId: 100,
    rpc: "https://gnosis-rpc.publicnode.com",
    explorer: "https://gnosisscan.io",
    symbol: "XDAI",
    color: "#04795B",
  },
  cronos: {
    id: "cronos",
    name: "Cronos",
    family: "evm",
    chainId: 25,
    rpc: "https://cronos-evm-rpc.publicnode.com",
    explorer: "https://cronoscan.com",
    symbol: "CRO",
    color: "#002D74",
  },
  fantom: {
    id: "fantom",
    name: "Fantom",
    family: "evm",
    chainId: 250,
    rpc: "https://rpcapi.fantom.network",
    explorer: "https://ftmscan.com",
    symbol: "FTM",
    color: "#1969FF",
  },
  polygonzkevm: {
    id: "polygonzkevm",
    name: "Polygon zkEVM",
    family: "evm",
    chainId: 1101,
    rpc: "https://polygon-zkevm.drpc.org",
    explorer: "https://zkevm.polygonscan.com",
    symbol: "ETH",
    color: "#8247E5",
  },
  unichain: {
    id: "unichain",
    name: "Unichain",
    family: "evm",
    chainId: 130,
    rpc: "https://unichain-rpc.publicnode.com",
    explorer: "https://uniscan.xyz",
    symbol: "ETH",
    color: "#FF37C7",
  },
  sonic: {
    id: "sonic",
    name: "Sonic",
    family: "evm",
    chainId: 146,
    rpc: "https://sonic-rpc.publicnode.com",
    explorer: "https://sonicscan.org",
    symbol: "S",
    color: "#FE9A4B",
  },
  sei: {
    id: "sei",
    name: "Sei",
    family: "evm",
    chainId: 1329,
    rpc: "https://sei-evm-rpc.publicnode.com",
    explorer: "https://seitrace.com",
    symbol: "SEI",
    color: "#9E1F19",
  },
  berachain: {
    id: "berachain",
    name: "Berachain",
    family: "evm",
    chainId: 80094,
    rpc: "https://berachain-rpc.publicnode.com",
    explorer: "https://berascan.com",
    symbol: "BERA",
    color: "#F5A623",
  },
  kava: {
    id: "kava",
    name: "Kava",
    family: "evm",
    chainId: 2222,
    rpc: "https://kava-evm-rpc.publicnode.com",
    explorer: "https://kavascan.com",
    symbol: "KAVA",
    color: "#FF564F",
  },
  dogecoin: {
    id: "dogecoin",
    name: "Dogecoin",
    family: "blockcypher",
    api: "https://api.blockcypher.com/v1/doge/main",
    explorer: "https://dogechain.info",
    path: "m/44'/3'/0'/0/0",
    p2pkh: 0x1e,
    symbol: "DOGE",
    color: "#C2A633",
    decimals: 8,
  },
  dash: {
    id: "dash",
    name: "Dash",
    family: "blockcypher",
    api: "https://api.blockcypher.com/v1/dash/main",
    explorer: "https://explorer.dash.org",
    path: "m/44'/5'/0'/0/0",
    p2pkh: 0x4c,
    symbol: "DASH",
    color: "#008CE7",
    decimals: 8,
  },
  xrp: {
    id: "xrp",
    name: "XRP Ledger",
    family: "xrp",
    api: "https://xrplcluster.com",
    explorer: "https://xrpscan.com",
    path: "m/44'/144'/0'/0/0",
    symbol: "XRP",
    color: "#25A768",
    decimals: 6,
  },
  cardano: {
    id: "cardano",
    name: "Cardano",
    family: "cardano",
    api: "https://api.koios.rest/api/v1",
    explorer: "https://cardanoscan.io",
    path: "m/1852'/1815'/0'/0/0",
    symbol: "ADA",
    color: "#0033AD",
    decimals: 6,
  },
  polkadot: {
    id: "polkadot",
    name: "Polkadot",
    family: "polkadot",
    rpc: "https://polkadot-rpc.publicnode.com",
    explorer: "https://polkadot.subscan.io",
    symbol: "DOT",
    color: "#E6007A",
    decimals: 10,
  },
  aptos: {
    id: "aptos",
    name: "Aptos",
    family: "aptos",
    api: "https://fullnode.mainnet.aptoslabs.com/v1",
    explorer: "https://explorer.aptoslabs.com",
    path: "m/44'/637'/0'/0'/0'",
    symbol: "APT",
    color: "#2DD8A3",
    decimals: 8,
  },
  near: {
    id: "near",
    name: "NEAR Protocol",
    family: "near",
    rpc: "https://rpc.mainnet.near.org",
    explorer: "https://nearblocks.io",
    path: "m/44'/397'/0'",
    symbol: "NEAR",
    color: "#00C08B",
    decimals: 24,
  },
  ton: {
    id: "ton",
    name: "Toncoin",
    family: "ton",
    api: "https://toncenter.com/api/v2",
    explorer: "https://tonviewer.com",
    symbol: "TON",
    color: "#0098EA",
    decimals: 9,
  },
  sui: {
    id: "sui",
    name: "Sui",
    family: "sui",
    api: "https://graphql.mainnet.sui.io/graphql",
    explorer: "https://suiscan.xyz/mainnet",
    symbol: "SUI",
    color: "#4DA2FF",
    decimals: 9,
  },
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

const native = (chain, extra = {}) => {
  const meta = chains[chain];
  return {
    id: chain,
    kind: "native",
    family: meta.family,
    chain,
    symbol: meta.symbol,
    name: extra.name || meta.name,
    decimals: meta.decimals || 18,
    color: meta.color,
    coingecko: extra.coingecko,
    logo: extra.logo,
    ...extra,
  };
};

/** Assets the wallet holds, prices and can send. */
export const assets = [
  native("bitcoin", { coingecko: "bitcoin", logo: cdn("btc"), name: "Bitcoin", decimals: 8 }),
  native("ethereum", { coingecko: "ethereum", logo: cdn("eth"), name: "Ethereum" }),
  native("bsc", { coingecko: "binancecoin", logo: cdn("bnb"), name: "BNB" }),
  native("solana", { coingecko: "solana", logo: cg(4128, "solana.png"), name: "Solana", decimals: 9 }),
  native("tron", { coingecko: "tron", logo: cdn("trx"), name: "TRON", decimals: 6 }),
  native("polygon", { coingecko: "polygon-ecosystem-token", logo: cg(4713, "polygon.png"), name: "Polygon" }),
  native("avalanche", { coingecko: "avalanche-2", logo: cg(12559, "avax.png"), name: "Avalanche" }),
  native("litecoin", { coingecko: "litecoin", logo: cdn("ltc"), name: "Litecoin", decimals: 8 }),

  token("ethereum", "usdt-eth", "USDT", "Tether USD", "0xdAC17F958D2ee523a2206206994597C13D831ec7", 6, "tether", "#26A17B", cdn("usdt")),
  token("ethereum", "usdc-eth", "USDC", "USD Coin", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("ethereum", "dai-eth", "DAI", "Dai", "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18, "dai", "#F5AC37", cdn("dai")),
  token("ethereum", "link-eth", "LINK", "Chainlink", "0x514910771AF9Ca656af840dff83E8264EcF986CA", 18, "chainlink", "#2A5ADA", cdn("link")),
  token("ethereum", "pepe-eth", "PEPE", "Pepe", "0x6982508145454Ce325dDbE47a25d4ec3d2311933", 18, "pepe", "#3D8130", cg(29850, "pepe-token.jpeg")),

  token("bsc", "usdt-bsc", "USDT", "Tether USD (BEP-20)", "0x55d398326f99059fF775485246999027B3197955", 18, "tether", "#26A17B", cdn("usdt")),
  token("bsc", "usdc-bsc", "USDC", "USD Coin (BEP-20)", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", 18, "usd-coin", "#2775CA", cdn("usdc")),

  token("polygon", "usdt-pol", "USDT", "Tether USD (Polygon)", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", 6, "tether", "#26A17B", cdn("usdt")),
  token("polygon", "usdc-pol", "USDC", "USD Coin (Polygon)", "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", 6, "usd-coin", "#2775CA", cdn("usdc")),

  token("base", "usdc-base", "USDC", "USD Coin (Base)", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("base", "cbbtc-base", "cbBTC", "Coinbase Wrapped BTC", "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", 8, "coinbase-wrapped-btc", "#0052FF", cg(34775, "cbbtc.png")),

  token("arbitrum", "arb-arb", "ARB", "Arbitrum", "0x912CE59144191C1204E64559FE8253a0e49E6548", 18, "arbitrum", "#28A0F0", cg(16547, "arbitrum.jpeg")),
  token("arbitrum", "usdc-arb", "USDC", "USD Coin (Arbitrum)", "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", 6, "usd-coin", "#2775CA", cdn("usdc")),

  token("optimism", "op-op", "OP", "Optimism", "0x4200000000000000000000000000000000000042", 18, "optimism", "#FF0420", cg(25244, "Optimism.png")),
  token("optimism", "usdc-op", "USDC", "USD Coin (Optimism)", "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", 6, "usd-coin", "#2775CA", cdn("usdc")),

  token("avalanche", "usdc-avax", "USDC", "USD Coin (Avalanche)", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("avalanche", "usdt-avax", "USDT", "Tether USD (Avalanche)", "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", 6, "tether", "#26A17B", cdn("usdt")),
];

export function coinById(id) {
  return assets.find((asset) => asset.id === id);
}

export function explorerTx(chainId, hash) {
  const chain = chains[chainId];
  if (!chain) return null;
  if (chain.family === "evm") return `${chain.explorer}/tx/${hash}`;
  if (chain.family === "utxo") return `${chain.explorer}/tx/${hash}`;
  if (chain.family === "solana") return `${chain.explorer}/tx/${hash}`;
  return `${chain.explorer}/#/transaction/${hash}`;
}

export function explorerAddress(chainId, address) {
  const chain = chains[chainId];
  if (!chain) return null;
  if (chain.family === "evm") return `${chain.explorer}/address/${address}`;
  if (chain.family === "utxo") return `${chain.explorer}/address/${address}`;
  if (chain.family === "blockcypher") return `${chain.explorer}/address/${address}`;
  if (chain.family === "xrp") return `${chain.explorer}/account/${address}`;
  if (chain.family === "cardano") return `${chain.explorer}/address/${address}`;
  if (chain.family === "polkadot") return `${chain.explorer}/account/${address}`;
  if (chain.family === "aptos") return `${chain.explorer}/account/${address}?network=mainnet`;
  if (chain.family === "near") return `${chain.explorer}/address/${address}`;
  if (chain.family === "ton") return `${chain.explorer}/${address}`;
  if (chain.family === "sui") return `${chain.explorer}/account/${address}`;
  if (chain.family === "solana") return `${chain.explorer}/account/${address}`;
  return `${chain.explorer}/#/address/${address}`;
}