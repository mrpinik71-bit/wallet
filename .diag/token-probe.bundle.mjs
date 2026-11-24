// src/lib/chains/config.js
var cdn = (symbol) => `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/${symbol.toLowerCase()}.png`;
var cg = (id, file) => `https://assets.coingecko.com/coins/images/${id}/large/${file}`;
var chains = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    family: "evm",
    chainId: 1,
    rpc: "https://ethereum-rpc.publicnode.com",
    explorer: "https://etherscan.io",
    symbol: "ETH",
    color: "#627EEA"
  },
  bsc: {
    id: "bsc",
    name: "BNB Smart Chain",
    family: "evm",
    chainId: 56,
    rpc: "https://bsc-rpc.publicnode.com",
    explorer: "https://bscscan.com",
    symbol: "BNB",
    color: "#F3BA2F"
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    family: "evm",
    chainId: 137,
    rpc: "https://polygon-bor-rpc.publicnode.com",
    explorer: "https://polygonscan.com",
    symbol: "POL",
    color: "#8247E5"
  },
  base: {
    id: "base",
    name: "Base",
    family: "evm",
    chainId: 8453,
    rpc: "https://base-rpc.publicnode.com",
    explorer: "https://basescan.org",
    symbol: "ETH",
    color: "#0052FF"
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum One",
    family: "evm",
    chainId: 42161,
    rpc: "https://arbitrum-one-rpc.publicnode.com",
    explorer: "https://arbiscan.io",
    symbol: "ETH",
    color: "#28A0F0"
  },
  optimism: {
    id: "optimism",
    name: "Optimism",
    family: "evm",
    chainId: 10,
    rpc: "https://optimism-rpc.publicnode.com",
    explorer: "https://optimistic.etherscan.io",
    symbol: "ETH",
    color: "#FF0420"
  },
  avalanche: {
    id: "avalanche",
    name: "Avalanche",
    family: "evm",
    chainId: 43114,
    rpc: "https://avalanche-c-chain-rpc.publicnode.com",
    explorer: "https://snowtrace.io",
    symbol: "AVAX",
    color: "#E84142"
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
    decimals: 8
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
    decimals: 8
  },
  // Bitcoin fork: same address format, its own ledger.
  fractal: {
    id: "fractal",
    name: "Fractal Bitcoin",
    family: "utxo",
    api: "https://mempool.fractalbitcoin.io/api",
    explorer: "https://mempool.fractalbitcoin.io",
    hrp: "bc",
    path: "m/84'/0'/0'/0/0",
    symbol: "FB",
    color: "#F7931A",
    decimals: 8
  },
  // Elements sidechain: the unconfidential segwit form of the same key.
  liquid: {
    id: "liquid",
    name: "Liquid Network",
    family: "utxo",
    api: "https://blockstream.info/liquid/api",
    explorer: "https://blockstream.info/liquid",
    hrp: "ex",
    path: "m/84'/1776'/0'/0/0",
    symbol: "L-BTC",
    color: "#46B9C8",
    decimals: 8
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
    decimals: 9
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
    decimals: 6
  },
  linea: {
    id: "linea",
    name: "Linea",
    family: "evm",
    chainId: 59144,
    rpc: "https://linea-rpc.publicnode.com",
    explorer: "https://lineascan.build",
    symbol: "ETH",
    color: "#61DFFF"
  },
  scroll: {
    id: "scroll",
    name: "Scroll",
    family: "evm",
    chainId: 534352,
    rpc: "https://scroll-rpc.publicnode.com",
    explorer: "https://scrollscan.com",
    symbol: "ETH",
    color: "#FFEEDA"
  },
  zksync: {
    id: "zksync",
    name: "zkSync Era",
    family: "evm",
    chainId: 324,
    rpc: "https://mainnet.era.zksync.io",
    explorer: "https://explorer.zksync.io",
    symbol: "ETH",
    color: "#8C8DFC"
  },
  mantle: {
    id: "mantle",
    name: "Mantle",
    family: "evm",
    chainId: 5e3,
    rpc: "https://mantle-rpc.publicnode.com",
    explorer: "https://mantlescan.xyz",
    symbol: "MNT",
    color: "#16B7A8"
  },
  celo: {
    id: "celo",
    name: "Celo",
    family: "evm",
    chainId: 42220,
    rpc: "https://celo-rpc.publicnode.com",
    explorer: "https://celoscan.io",
    symbol: "CELO",
    color: "#FCFF52"
  },
  gnosis: {
    id: "gnosis",
    name: "Gnosis",
    family: "evm",
    chainId: 100,
    rpc: "https://gnosis-rpc.publicnode.com",
    explorer: "https://gnosisscan.io",
    symbol: "XDAI",
    color: "#04795B"
  },
  cronos: {
    id: "cronos",
    name: "Cronos",
    family: "evm",
    chainId: 25,
    rpc: "https://cronos-evm-rpc.publicnode.com",
    explorer: "https://cronoscan.com",
    symbol: "CRO",
    color: "#002D74"
  },
  fantom: {
    id: "fantom",
    name: "Fantom",
    family: "evm",
    chainId: 250,
    rpc: "https://rpcapi.fantom.network",
    explorer: "https://explorer.fantom.network",
    symbol: "FTM",
    color: "#1969FF"
  },
  polygonzkevm: {
    id: "polygonzkevm",
    name: "Polygon zkEVM",
    family: "evm",
    chainId: 1101,
    // drpc answers one call but refuses batches; this node serves wide ones.
    rpc: "https://zkevm-rpc.com",
    // Free gateways come and go: the second endpoint is used when the first one
    // is busy, so a scan never reports zkEVM as failed because of one node.
    rpcs: ["https://polygon-zkevm.rpc.thirdweb.com"],
    explorer: "https://zkevm.polygonscan.com",
    symbol: "ETH",
    color: "#8247E5"
  },
  unichain: {
    id: "unichain",
    name: "Unichain",
    family: "evm",
    chainId: 130,
    rpc: "https://unichain-rpc.publicnode.com",
    explorer: "https://uniscan.xyz",
    symbol: "ETH",
    color: "#FF37C7"
  },
  sonic: {
    id: "sonic",
    name: "Sonic",
    family: "evm",
    chainId: 146,
    rpc: "https://sonic-rpc.publicnode.com",
    explorer: "https://sonicscan.org",
    symbol: "S",
    color: "#FE9A4B"
  },
  sei: {
    id: "sei",
    name: "Sei",
    family: "evm",
    chainId: 1329,
    rpc: "https://sei-evm-rpc.publicnode.com",
    explorer: "https://seitrace.com",
    symbol: "SEI",
    color: "#9E1F19"
  },
  berachain: {
    id: "berachain",
    name: "Berachain",
    family: "evm",
    chainId: 80094,
    rpc: "https://berachain-rpc.publicnode.com",
    explorer: "https://berascan.com",
    symbol: "BERA",
    color: "#F5A623"
  },
  kava: {
    id: "kava",
    name: "Kava",
    family: "evm",
    chainId: 2222,
    rpc: "https://kava-evm-rpc.publicnode.com",
    explorer: "https://kavascan.com",
    symbol: "KAVA",
    color: "#FF564F"
  },
  abstract: {
    id: "abstract",
    name: "Abstract",
    family: "evm",
    chainId: 2741,
    rpc: "https://api.mainnet.abs.xyz",
    explorer: "https://abscan.org",
    symbol: "ETH",
    color: "#4C8DFF"
  },
  megaeth: {
    id: "megaeth",
    name: "MegaETH",
    family: "evm",
    chainId: 4326,
    rpc: "https://mainnet.megaeth.com/rpc",
    explorer: "https://megaexplorer.xyz",
    symbol: "ETH",
    color: "#DFFF00"
  },
  core: {
    id: "core",
    name: "Core Blockchain",
    family: "evm",
    chainId: 1116,
    rpc: "https://rpc.coredao.org",
    explorer: "https://scan.coredao.org",
    symbol: "CORE",
    color: "#FF9211"
  },
  // Bitcoin sidechains and L2s: the same EVM account is funded on each of them.
  rootstock: {
    id: "rootstock",
    name: "Rootstock",
    family: "evm",
    chainId: 30,
    rpc: "https://public-node.rsk.co",
    explorer: "https://explorer.rootstock.io",
    symbol: "RBTC",
    color: "#FF9416"
  },
  merlin: {
    id: "merlin",
    name: "Merlin Chain",
    family: "evm",
    chainId: 4200,
    rpc: "https://rpc.merlinchain.io",
    explorer: "https://scan.merlinchain.io",
    symbol: "MERL",
    color: "#7A4DFF"
  },
  bob: {
    id: "bob",
    name: "BOB",
    family: "evm",
    chainId: 60808,
    rpc: "https://rpc.gobob.xyz",
    explorer: "https://explorer.gobob.xyz",
    symbol: "ETH",
    color: "#F3A93B"
  },
  botanix: {
    id: "botanix",
    name: "Botanix",
    family: "evm",
    chainId: 3637,
    // Botanix's own node stopped answering; thirdweb still serves the chain,
    // though only one call per request (the reader narrows its batch for it).
    rpc: "https://3637.rpc.thirdweb.com",
    explorer: "https://botanixscan.io",
    symbol: "BTC",
    color: "#8FD14F",
    decimals: 18
  },
  bevm: {
    id: "bevm",
    name: "BEVM",
    family: "evm",
    chainId: 11501,
    // BEVM runs its mainnet nodes under the GEB name now; this one serves full
    // 40-call batches, the retired gateway refused every request.
    rpc: "https://rpc-mainnet-1.geb.network",
    explorer: "https://scan.geb.network",
    symbol: "BTC",
    color: "#F0A32B",
    decimals: 18
  },
  citrea: {
    id: "citrea",
    name: "Citrea",
    family: "evm",
    chainId: 4114,
    rpc: "https://rpc.mainnet.citrea.xyz",
    explorer: "https://explorer.mainnet.citrea.xyz",
    symbol: "cBTC",
    color: "#FF7A2F",
    decimals: 18
  },
  dogecoin: {
    id: "dogecoin",
    name: "Dogecoin",
    family: "blockcypher",
    api: "https://api.blockcypher.com/v1/doge/main",
    explorer: "https://dogechain.com",
    path: "m/44'/3'/0'/0/0",
    p2pkh: 30,
    symbol: "DOGE",
    color: "#C2A633",
    decimals: 8
  },
  dash: {
    id: "dash",
    name: "Dash",
    family: "blockcypher",
    api: "https://api.blockcypher.com/v1/dash/main",
    explorer: "https://explorer.dash.org",
    path: "m/44'/5'/0'/0/0",
    p2pkh: 76,
    symbol: "DASH",
    color: "#008CE7",
    decimals: 8
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
    decimals: 6
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
    decimals: 6
  },
  polkadot: {
    id: "polkadot",
    name: "Polkadot",
    family: "polkadot",
    rpc: "https://polkadot-rpc.publicnode.com",
    explorer: "https://polkadot.subscan.io",
    symbol: "DOT",
    color: "#E6007A",
    decimals: 10
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
    decimals: 8
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
    decimals: 24
  },
  ton: {
    id: "ton",
    name: "Toncoin",
    family: "ton",
    api: "https://toncenter.com/api/v2",
    explorer: "https://tonviewer.com",
    symbol: "TON",
    color: "#0098EA",
    decimals: 9
  },
  sui: {
    id: "sui",
    name: "Sui",
    family: "sui",
    api: "https://graphql.mainnet.sui.io/graphql",
    explorer: "https://suiscan.xyz/mainnet",
    symbol: "SUI",
    color: "#4DA2FF",
    decimals: 9
  },
  stacks: {
    id: "stacks",
    name: "Stacks",
    family: "stacks",
    api: "https://api.mainnet.hiro.so",
    explorer: "https://explorer.hiro.so",
    path: "m/44'/5757'/0'/0/0",
    symbol: "STX",
    color: "#5546FF",
    decimals: 6
  },
  babylon: {
    id: "babylon",
    name: "Babylon",
    family: "babylon",
    api: "https://babylon-rest.publicnode.com",
    apis: ["https://babylon-api.polkachu.com"],
    explorer: "https://babylon.explorers.guru",
    hrp: "bbn",
    path: "m/44'/118'/0'/0/0",
    symbol: "BABY",
    color: "#F4A44C",
    decimals: 6
  }
};
var token = (chain, id, symbol, name, address, decimals, coingecko, color, logo) => ({
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
  logo
});
var native = (chain, extra = {}) => {
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
    ...extra
  };
};
var assets = [
  native("bitcoin", { coingecko: "bitcoin", logo: cdn("btc"), name: "Bitcoin", decimals: 8 }),
  native("ethereum", { coingecko: "ethereum", logo: cdn("eth"), name: "Ethereum" }),
  native("bsc", { coingecko: "binancecoin", logo: cdn("bnb"), name: "BNB" }),
  native("solana", { coingecko: "solana", logo: cg(4128, "solana.png"), name: "Solana", decimals: 9 }),
  native("tron", { coingecko: "tron", logo: cdn("trx"), name: "TRON", decimals: 6 }),
  native("polygon", { coingecko: "polygon-ecosystem-token", logo: cg(4713, "polygon.png"), name: "Polygon" }),
  native("avalanche", { coingecko: "avalanche-2", logo: cg(12559, "avax.png"), name: "Avalanche" }),
  native("zksync", { coingecko: "ethereum", logo: cdn("eth"), name: "zkSync Era" }),
  native("linea", { coingecko: "ethereum", logo: cdn("eth"), name: "Linea" }),
  native("scroll", { coingecko: "ethereum", logo: cdn("eth"), name: "Scroll" }),
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
  token("avalanche", "usdt-avax", "USDT", "Tether USD (Avalanche)", "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", 6, "tether", "#26A17B", cdn("usdt"))
];

// src/lib/chains/custom-rpc.js
var STORAGE_KEY = "helix.rpc.custom";
var valid = (value) => /^https:\/\/\S+$/i.test(String(value || "").trim());
function readCustomRpc() {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || typeof stored !== "object") return {};
    const out = {};
    for (const [chainId, url] of Object.entries(stored)) {
      if (valid(url)) out[chainId] = String(url).trim();
    }
    return out;
  } catch {
    return {};
  }
}
function customEndpoint(chainId) {
  if (!chainId) return null;
  return readCustomRpc()[chainId] || null;
}

// src/lib/chains/drpc-relay.js
var DRPC_NETWORKS = {
  ethereum: "ethereum",
  bsc: "bsc",
  base: "base",
  arbitrum: "arbitrum",
  polygon: "polygon",
  optimism: "optimism",
  avalanche: "avalanche",
  linea: "linea",
  scroll: "scroll",
  zksync: "zksync",
  mantle: "mantle",
  celo: "celo",
  gnosis: "gnosis",
  cronos: "cronos",
  fantom: "fantom",
  unichain: "unichain",
  sonic: "sonic",
  sei: "sei",
  core: "core",
  polygonzkevm: "polygon-zkevm"
};
function drpcRelay(chainId) {
  const network = DRPC_NETWORKS[chainId];
  return network ? `/api/rpc-drpc?network=${network}` : null;
}

// src/lib/chains/scan-lanes.js
var START_LANES = 32;
var lanes = /* @__PURE__ */ new Map();
var caps = /* @__PURE__ */ new Map();
var capOf = (host) => caps.get(host) ?? START_LANES;
function slowHost(host) {
  if (!host) return;
  caps.set(host, Math.max(1, Math.floor(capOf(host) / 2)));
}
function hostKey(url) {
  try {
    return new URL(url).host;
  } catch {
    return String(url || "");
  }
}
var wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function slot(host) {
  const lane = lanes.get(host) || { active: 0, queue: [] };
  lanes.set(host, lane);
  return new Promise((resolve) => {
    const start = () => {
      lane.active += 1;
      resolve(() => {
        lane.active -= 1;
        const next = lane.queue.shift();
        if (next) next();
      });
    };
    if (lane.active < capOf(host)) start();
    else lane.queue.push(start);
  });
}
async function request(url, init = {}, { timeout = 15e3, attempts = 3 } = {}) {
  const host = hostKey(url);
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const release = await slot(host);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    let response = null;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error("This node did not answer.");
    } finally {
      clearTimeout(timer);
      release();
    }
    if (response) {
      if (response.status !== 429) return response;
      slowHost(host);
      lastError = new Error("This node is busy (429).");
      lastError.status = 429;
    }
    if (attempt < attempts - 1) await wait(250 * 2 ** attempt + Math.random() * 150);
  }
  throw lastError || new Error("This node did not answer.");
}

// src/lib/chains/scan-mirrors.js
var EVM_MIRRORS = {
  ethereum: [
    "https://ethereum-rpc.publicnode.com",
    // 10
    "https://eth-mainnet.public.blastapi.io",
    // 10
    "https://gateway.tenderly.co/public/mainnet"
    // 20
  ],
  bsc: [
    "https://bsc-dataseed.bnbchain.org",
    // 10
    "https://bsc-rpc.publicnode.com",
    // 10
    "https://bsc-mainnet.public.blastapi.io"
    // 10
  ],
  base: [
    "https://base-rpc.publicnode.com",
    // 10
    "https://base-mainnet.public.blastapi.io",
    // 10
    "https://mainnet.base.org"
    // 10
  ],
  arbitrum: [
    "https://arbitrum-one-rpc.publicnode.com",
    // 10
    "https://arb1.arbitrum.io/rpc",
    // 10
    "https://arbitrum-one.public.blastapi.io"
    // 10
  ],
  polygon: [
    "https://polygon-bor-rpc.publicnode.com",
    // 10
    "https://polygon.publicnode.com"
    // 10
  ],
  optimism: [
    "https://optimism-rpc.publicnode.com",
    // 10
    "https://1rpc.io/op"
    // 10
  ],
  avalanche: [
    "https://avalanche-c-chain-rpc.publicnode.com",
    // 10
    "https://api.avax.network/ext/bc/C/rpc"
    // 10
  ],
  linea: [
    "https://linea-rpc.publicnode.com",
    // 10
    "https://rpc.linea.build"
    // 10
  ],
  scroll: [
    "https://scroll-rpc.publicnode.com",
    // 10
    "https://rpc.scroll.io"
    // 10
  ],
  mantle: [
    "https://mantle-rpc.publicnode.com",
    // 10
    "https://rpc.mantle.xyz"
    // 10
  ],
  celo: [
    "https://celo-rpc.publicnode.com",
    // 10
    "https://forno.celo.org"
    // 10
  ],
  gnosis: [
    "https://gnosis-rpc.publicnode.com",
    // 10
    "https://rpc.gnosischain.com"
    // 10
  ],
  cronos: [
    "https://cronos-evm-rpc.publicnode.com",
    // 10
    "https://evm.cronos.org"
    // 10
  ],
  sonic: ["https://sonic-rpc.publicnode.com"],
  // 10
  sei: [
    "https://sei-evm-rpc.publicnode.com",
    // 10
    "https://evm-rpc.sei-apis.com"
    // 10
  ],
  berachain: [
    "https://berachain-rpc.publicnode.com",
    // 10
    "https://rpc.berachain.com"
    // 10
  ],
  kava: [
    "https://kava-evm-rpc.publicnode.com",
    // 10
    "https://evm.kava.io"
    // 10
  ],
  unichain: [
    "https://unichain-rpc.publicnode.com",
    // 10
    "https://mainnet.unichain.org"
    // 10
  ],
  // The chain's own node is the only reader that answers a batch here; the free
  // gateways either refuse batches or are down, so they are not listed.
  zksync: ["https://mainnet.era.zksync.io"],
  // 10
  // zkevm-rpc.com answers when it is up and frequently answers 502, so the
  // chain's configured node is left as the fallback behind it.
  polygonzkevm: ["https://zkevm-rpc.com"],
  // 10
  core: [
    "https://rpc.coredao.org",
    // 10
    "https://rpc.ankr.com/core"
    // 10
  ],
  // The Fantom Foundation's own node; fantom-rpc.publicnode.com answers 404.
  fantom: ["https://rpcapi.fantom.network"],
  // 10
  rootstock: [
    "https://mycrypto.rsk.co",
    // 10
    "https://public-node.rsk.co"
    // 10
  ],
  citrea: [
    "https://rpc.citreascan.com",
    // 10
    "https://rpc.mainnet.citrea.xyz"
    // 10
  ],
  megaeth: [
    "https://mainnet.megaeth.com/rpc",
    // 10
    "https://megaeth.gateway.tenderly.co"
    // 10
  ],
  bob: [
    "https://rpc.gobob.xyz",
    // 10
    "https://bob.gateway.tenderly.co"
    // 10
  ],
  merlin: ["https://rpc.merlinchain.io"]
  // 10
};

// src/lib/chains/scan-batch.js
var CALLS_PER_REQUEST = 600;
var CHAIN_CALL_LIMIT = { bob: 40 };
var sizeCaps = /* @__PURE__ */ new Map();
var endpointCaps = /* @__PURE__ */ new Map();
var coolUntil = /* @__PURE__ */ new Map();
var COOLDOWN_MS = 12e3;
var downStrikes = /* @__PURE__ */ new Map();
var chainRests = /* @__PURE__ */ new Map();
var REST_MS = 45e3;
var balanceOfData = (address) => `0x70a08231${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
function buildCalls(addresses, coins) {
  const native3 = coins.find((coin) => coin.kind !== "token");
  const tokens = coins.filter((coin) => coin.kind === "token");
  const calls = [];
  const slots = [];
  addresses.forEach((address, index) => {
    if (native3) {
      const id = calls.length + 1;
      slots.push({ id, index, coinId: native3.id, decimals: native3.decimals });
      calls.push({ jsonrpc: "2.0", id, method: "eth_getBalance", params: [address, "latest"] });
    }
    for (const coin of tokens) {
      const id = calls.length + 1;
      slots.push({ id, index, coinId: coin.id, decimals: coin.decimals });
      calls.push({
        jsonrpc: "2.0",
        id,
        method: "eth_call",
        params: [{ to: coin.address, data: balanceOfData(address) }, "latest"]
      });
    }
  });
  return { calls, slots };
}
async function postTo(chainId, endpoint, calls) {
  const known = endpointCaps.get(endpoint);
  if (known && calls.length > known) {
    const error = new Error(`${chainId} batch too wide for this node`);
    error.batchRefused = true;
    throw error;
  }
  if ((coolUntil.get(endpoint) || 0) > Date.now()) {
    const error = new Error(`${chainId} node busy (429).`);
    error.status = 429;
    throw error;
  }
  const response = await request(
    endpoint,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(calls)
    },
    { attempts: 2 }
  );
  if (!response.ok) {
    const error = new Error(`${chainId} ${response.status}`);
    error.status = response.status;
    if (response.status === 429) coolUntil.set(endpoint, Date.now() + COOLDOWN_MS);
    error.batchRefused = [400, 413, 414].includes(response.status) && calls.length > 1;
    if (error.batchRefused) endpointCaps.set(endpoint, Math.max(1, Math.floor(calls.length / 2)));
    throw error;
  }
  const body = await response.json().catch(() => null);
  if (!Array.isArray(body)) {
    const error = new Error(`${chainId} rejected the batch`);
    const text = JSON.stringify(body || {});
    if (/batch|exceed|maximum of \d+|too many rpc calls/i.test(text)) {
      error.batchRefused = calls.length > 1;
    } else if (/rate|limit|busy|capacity|too many/i.test(text)) {
      error.status = 429;
    } else {
      error.batchRefused = calls.length > 1;
    }
    throw error;
  }
  return body;
}
async function postCalls(chainId, calls) {
  if ((chainRests.get(chainId) || 0) > Date.now()) {
    throw new Error(`${chainId} nodes are not answering`);
  }
  const chain = chains[chainId];
  const endpoints = [
    customEndpoint(chainId),
    ...EVM_MIRRORS[chainId] || [],
    drpcRelay(chainId),
    chain.rpc,
    ...chain.rpcs || []
  ].filter(Boolean);
  let lastError = null;
  let busy = false;
  let narrow = false;
  for (const endpoint of endpoints) {
    try {
      const body = await postTo(chainId, endpoint, calls);
      downStrikes.delete(chainId);
      return body;
    } catch (error) {
      lastError = error;
      if (error?.status === 429) busy = true;
      if (error?.batchRefused) narrow = true;
    }
  }
  if (narrow && lastError && !lastError.batchRefused) lastError.batchRefused = true;
  if (!busy) {
    const strikes = (downStrikes.get(chainId) || 0) + 1;
    downStrikes.set(chainId, strikes);
    if (strikes >= 3) {
      chainRests.set(chainId, Date.now() + REST_MS);
      downStrikes.delete(chainId);
    }
  }
  throw lastError;
}
async function readCalls(chainId, calls) {
  const cap = Math.min(sizeCaps.get(chainId) || CALLS_PER_REQUEST, CHAIN_CALL_LIMIT[chainId] || CALLS_PER_REQUEST);
  if (calls.length > cap) {
    const values2 = /* @__PURE__ */ new Map();
    for (let start = 0; start < calls.length; start += cap) {
      const part = await readCalls(chainId, calls.slice(start, start + cap));
      for (const [id, value] of part) values2.set(id, value);
    }
    return values2;
  }
  let body;
  try {
    body = await postCalls(chainId, calls);
  } catch (error) {
    if (!error.batchRefused) throw error;
    const half = Math.ceil(calls.length / 2);
    sizeCaps.set(chainId, Math.max(1, Math.min(cap, half)));
    const values2 = /* @__PURE__ */ new Map();
    for (const part of [calls.slice(0, half), calls.slice(half)]) {
      if (!part.length) continue;
      for (const [id, value] of await readCalls(chainId, part)) values2.set(id, value);
    }
    return values2;
  }
  const values = /* @__PURE__ */ new Map();
  const missing = [];
  for (const item of body) {
    if (!item || item.id === void 0) continue;
    if (item.error || item.result === void 0 || item.result === null) missing.push(item.id);
    else values.set(item.id, item.result);
  }
  if (missing.length && missing.length < calls.length) {
    const retries = calls.filter((call) => missing.includes(call.id));
    const again = await readCalls(chainId, retries).catch(() => /* @__PURE__ */ new Map());
    for (const [id, value] of again) values.set(id, value);
  }
  if (values.size === 0 && calls.length > 1) {
    const error = new Error(`${chainId} busy`);
    error.status = 429;
    throw error;
  }
  return values;
}
async function readGroup(chainId, addresses, coins) {
  const { calls, slots } = buildCalls(addresses, coins);
  if (!calls.length) return /* @__PURE__ */ new Map();
  const raw = await readCalls(chainId, calls);
  const balances = /* @__PURE__ */ new Map();
  for (const slot2 of slots) {
    if (!raw.has(slot2.id)) continue;
    let amount;
    try {
      amount = Number(BigInt(raw.get(slot2.id))) / 10 ** slot2.decimals;
    } catch {
      continue;
    }
    const entry = balances.get(slot2.index) || /* @__PURE__ */ new Map();
    entry.set(slot2.coinId, amount);
    balances.set(slot2.index, entry);
  }
  return balances;
}
async function evmChainBalancesMany(chainId, addresses, coins) {
  const perAddress = Math.max(1, coins.length);
  const groupSize = Math.max(1, Math.floor(CALLS_PER_REQUEST / perAddress));
  const groups = [];
  for (let start = 0; start < addresses.length; start += groupSize) {
    groups.push({ start, list: addresses.slice(start, start + groupSize) });
  }
  const parts = await Promise.all(groups.map((group) => readGroup(chainId, group.list, coins)));
  const balances = /* @__PURE__ */ new Map();
  parts.forEach((part, position) => {
    const offset = groups[position].start;
    for (const [index, entry] of part) balances.set(offset + index, entry);
  });
  return balances;
}

// src/lib/chains/scan-catalog.js
var cdn2 = (symbol) => `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/${symbol.toLowerCase()}.png`;
var COINGECKO = {
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
  abstract: "ethereum",
  megaeth: "ethereum",
  core: "coredaoorg",
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
  ton: "the-open-network",
  sui: "sui",
  rootstock: "rootstock",
  merlin: "merlin-chain",
  bob: "ethereum",
  botanix: "bitcoin",
  bevm: "bitcoin",
  citrea: "bitcoin",
  fractal: "fractal-bitcoin",
  liquid: "bitcoin",
  stacks: "blockstack",
  babylon: "babylon-chain"
};
var LOGO = {
  bitcoin: cdn2("btc"),
  ethereum: cdn2("eth"),
  bsc: cdn2("bnb"),
  litecoin: cdn2("ltc"),
  dogecoin: cdn2("doge"),
  dash: cdn2("dash"),
  tron: cdn2("trx"),
  xrp: cdn2("xrp"),
  cardano: cdn2("ada"),
  polkadot: cdn2("dot"),
  aptos: "https://assets.coingecko.com/coins/images/26455/large/aptos_round.png",
  near: "https://assets.coingecko.com/coins/images/10365/large/near.jpg",
  ton: "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png",
  sui: "https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg",
  solana: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
  avalanche: "https://assets.coingecko.com/coins/images/12559/large/avax.png",
  polygon: "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
  stacks: "https://assets.coingecko.com/coins/images/2069/large/Stacks_logo_full.png",
  botanix: cdn2("btc"),
  bevm: cdn2("btc"),
  citrea: cdn2("btc"),
  liquid: cdn2("btc")
};
var native2 = (chainId) => {
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
    logo: LOGO[chainId]
  };
};
var token2 = (chain, id, symbol, name, address, decimals, coingecko, color, logo) => ({
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
  logo
});
var TOKENS = [
  token2("ethereum", "usdt-eth", "USDT", "Tether USD", "0xdAC17F958D2ee523a2206206994597C13D831ec7", 6, "tether", "#26A17B", cdn2("usdt")),
  token2("ethereum", "usdc-eth", "USDC", "USD Coin", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("ethereum", "dai-eth", "DAI", "Dai", "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18, "dai", "#F5AC37", cdn2("dai")),
  token2("ethereum", "link-eth", "LINK", "Chainlink", "0x514910771AF9Ca656af840dff83E8264EcF986CA", 18, "chainlink", "#2A5ADA", cdn2("link")),
  token2("ethereum", "uni-eth", "UNI", "Uniswap", "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", 18, "uniswap", "#FF007A", cdn2("uni")),
  token2("ethereum", "aave-eth", "AAVE", "Aave", "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", 18, "aave", "#B6509E"),
  token2("ethereum", "shib-eth", "SHIB", "Shiba Inu", "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", 18, "shiba-inu", "#F00500"),
  token2("ethereum", "pepe-eth", "PEPE", "Pepe", "0x6982508145454Ce325dDbE47a25d4ec3d2311933", 18, "pepe", "#3D8130"),
  token2("ethereum", "wbtc-eth", "WBTC", "Wrapped Bitcoin", "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", 8, "wrapped-bitcoin", "#F7931A", cdn2("btc")),
  token2("bsc", "usdt-bsc", "USDT", "Tether USD (BEP-20)", "0x55d398326f99059fF775485246999027B3197955", 18, "tether", "#26A17B", cdn2("usdt")),
  token2("bsc", "usdc-bsc", "USDC", "USD Coin (BEP-20)", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", 18, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("bsc", "cake-bsc", "CAKE", "PancakeSwap", "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", 18, "pancakeswap-token", "#633001"),
  token2("bsc", "busd-bsc", "BUSD", "Binance USD", "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", 18, "binance-usd", "#F0B90B"),
  token2("polygon", "usdt-pol", "USDT", "Tether USD (Polygon)", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", 6, "tether", "#26A17B", cdn2("usdt")),
  token2("polygon", "usdc-pol", "USDC", "USD Coin (Polygon)", "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("base", "usdc-base", "USDC", "USD Coin (Base)", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("base", "cbbtc-base", "cbBTC", "Coinbase Wrapped BTC", "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", 8, "coinbase-wrapped-btc", "#0052FF"),
  token2("arbitrum", "usdc-arb", "USDC", "USD Coin (Arbitrum)", "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("arbitrum", "usdt-arb", "USDT", "Tether USD (Arbitrum)", "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", 6, "tether", "#26A17B", cdn2("usdt")),
  token2("arbitrum", "arb-arb", "ARB", "Arbitrum", "0x912CE59144191C1204E64559FE8253a0e49E6548", 18, "arbitrum", "#28A0F0"),
  token2("optimism", "usdc-op", "USDC", "USD Coin (Optimism)", "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("optimism", "usdt-op", "USDT", "Tether USD (Optimism)", "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", 6, "tether", "#26A17B", cdn2("usdt")),
  token2("optimism", "op-op", "OP", "Optimism", "0x4200000000000000000000000000000000000042", 18, "optimism", "#FF0420"),
  token2("avalanche", "usdc-avax", "USDC", "USD Coin (Avalanche)", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("avalanche", "usdt-avax", "USDT", "Tether USD (Avalanche)", "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", 6, "tether", "#26A17B", cdn2("usdt")),
  token2("celo", "usdc-celo", "USDC", "USD Coin (Celo)", "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("tron", "usdt-tron", "USDT", "Tether USD (TRC-20)", "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 6, "tether", "#26A17B", cdn2("usdt")),
  // USDT is what most of these wallets actually hold, so it is read on TON (a
  // jetton) and Solana (an SPL token) too, not only on the EVM networks.
  token2("ton", "usdt-ton", "USDT", "Tether USD (TON)", "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", 6, "tether", "#26A17B", cdn2("usdt")),
  token2("solana", "usdt-sol", "USDT", "Tether USD (Solana)", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", 6, "tether", "#26A17B", cdn2("usdt")),
  token2("solana", "usdc-sol", "USDC", "USD Coin (Solana)", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("base", "usdt-base", "USDT", "Tether USD (Base)", "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", 6, "tether", "#26A17B", cdn2("usdt")),
  // Airdrop networks: the native coin alone misses claimed stablecoins, which is
  // usually what is left on these chains.
  token2("zksync", "usdc-zksync", "USDC", "USD Coin (zkSync Era)", "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("zksync", "usdt-zksync", "USDT", "Tether USD (zkSync Era)", "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C", 6, "tether", "#26A17B", cdn2("usdt")),
  token2("linea", "usdc-linea", "USDC", "USD Coin (Linea)", "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("linea", "usdt-linea", "USDT", "Tether USD (Linea)", "0xA219439258ca9da29E9Cc4cE5596924745e12B93", 6, "tether", "#26A17B", cdn2("usdt")),
  token2("scroll", "usdc-scroll", "USDC", "USD Coin (Scroll)", "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("scroll", "usdt-scroll", "USDT", "Tether USD (Scroll)", "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df", 6, "tether", "#26A17B", cdn2("usdt")),
  token2("mantle", "usdc-mantle", "USDC", "USD Coin (Mantle)", "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", 6, "usd-coin", "#2775CA", cdn2("usdc")),
  token2("mantle", "usdt-mantle", "USDT", "Tether USD (Mantle)", "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE", 6, "tether", "#26A17B", cdn2("usdt")),
  // Airdrop tokens that live as SPL tokens on Solana rather than on their own chain.
  token2("solana", "grass-sol", "GRASS", "Grass", "Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs", 9, "grass", "#1DC46D")
];
var OFFLINE_CHAINS = /* @__PURE__ */ new Set(["botanix", "liquid", "dash"]);
var SCAN_ASSETS = [...Object.keys(COINGECKO).map(native2), ...TOKENS].filter(
  (asset) => !OFFLINE_CHAINS.has(asset.chain)
);
var SCAN_CHAINS = [...new Set(SCAN_ASSETS.map((asset) => asset.chain))];

// .diag/token-probe.mjs
var WHALE = "0xf977814e90da44bfa03b6295a0616a897441acec";
var WALLETS = {
  ethereum: ["0x5754284f345afc66a98fbB0a0Afe71e0F007B949"],
  bsc: ["0x8894E0a0c962CB723c1976a4421c95949bE2D4E3"],
  polygon: [WHALE],
  base: [WHALE],
  arbitrum: [WHALE],
  optimism: [WHALE],
  avalanche: [WHALE]
};
async function main() {
  const out = {};
  for (const [chain, addresses] of Object.entries(WALLETS)) {
    const coins = SCAN_ASSETS.filter((coin) => coin.chain === chain);
    const started = Date.now();
    try {
      const values = await evmChainBalancesMany(chain, addresses, coins);
      const entry = values.get(0) || /* @__PURE__ */ new Map();
      out[chain] = {
        ms: Date.now() - started,
        read: `${entry.size}/${coins.length}`,
        held: coins.filter((coin) => entry.has(coin.id) && entry.get(coin.id) > 0).map((coin) => `${coin.symbol}=${Number(entry.get(coin.id).toFixed(4))}`),
        missing: coins.filter((coin) => !entry.has(coin.id)).map((coin) => coin.symbol)
      };
    } catch (error) {
      out[chain] = { error: String(error?.message).slice(0, 120), ms: Date.now() - started };
    }
  }
  console.log(JSON.stringify(out, null, 1));
}
main();
