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
  babylon: "babylon-chain",
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
  ton: "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png",
  sui: "https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg",
  solana: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
  avalanche: "https://assets.coingecko.com/coins/images/12559/large/avax.png",
  polygon: "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
  stacks: "https://assets.coingecko.com/coins/images/2069/large/Stacks_logo_full.png",
  botanix: cdn("btc"),
  bevm: cdn("btc"),
  citrea: cdn("btc"),
  liquid: cdn("btc"),
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
  // USDT is what most of these wallets actually hold, so it is read on TON (a
  // jetton) and Solana (an SPL token) too, not only on the EVM networks.
  token("ton", "usdt-ton", "USDT", "Tether USD (TON)", "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", 6, "tether", "#26A17B", cdn("usdt")),
  token("solana", "usdt-sol", "USDT", "Tether USD (Solana)", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", 6, "tether", "#26A17B", cdn("usdt")),
  token("solana", "usdc-sol", "USDC", "USD Coin (Solana)", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("base", "usdt-base", "USDT", "Tether USD (Base)", "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", 6, "tether", "#26A17B", cdn("usdt")),

  // Airdrop networks: the native coin alone misses claimed stablecoins, which is
  // usually what is left on these chains.
  token("zksync", "usdc-zksync", "USDC", "USD Coin (zkSync Era)", "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("zksync", "usdt-zksync", "USDT", "Tether USD (zkSync Era)", "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C", 6, "tether", "#26A17B", cdn("usdt")),

  token("linea", "usdc-linea", "USDC", "USD Coin (Linea)", "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("linea", "usdt-linea", "USDT", "Tether USD (Linea)", "0xA219439258ca9da29E9Cc4cE5596924745e12B93", 6, "tether", "#26A17B", cdn("usdt")),

  token("scroll", "usdc-scroll", "USDC", "USD Coin (Scroll)", "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("scroll", "usdt-scroll", "USDT", "Tether USD (Scroll)", "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df", 6, "tether", "#26A17B", cdn("usdt")),

  token("mantle", "usdc-mantle", "USDC", "USD Coin (Mantle)", "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("mantle", "usdt-mantle", "USDT", "Tether USD (Mantle)", "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE", 6, "tether", "#26A17B", cdn("usdt")),

  // Airdrop tokens that live as SPL tokens on Solana rather than on their own chain.
  token("solana", "grass-sol", "GRASS", "Grass", "Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs", 9, "grass", "#1DC46D"),

  // Stablecoins on the remaining networks, each contract confirmed on its own
  // chain (symbol and decimals read from the contract, not copied from a list).
  token("gnosis", "usdc-gno", "USDC", "USD Coin (Gnosis)", "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("gnosis", "usdt-gno", "USDT", "Tether USD (Gnosis)", "0x4ECaBa5870353805a9F068101A40E0f32ed605C6", 6, "tether", "#26A17B", cdn("usdt")),
  token("cronos", "usdt-cro", "USDT", "Tether USD (Cronos)", "0x66e428c3f67a68878562e79A0234c1F83c208770", 6, "tether", "#26A17B", cdn("usdt")),
  token("fantom", "usdc-ftm", "USDC", "USD Coin (Fantom)", "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("fantom", "usdt-ftm", "USDT", "Tether USD (Fantom)", "0x049d68029688eAbF473097a2fC38ef61633A3C7A", 6, "tether", "#26A17B", cdn("usdt")),
  token("unichain", "usdc-uni", "USDC", "USD Coin (Unichain)", "0x078D782b760474a361dDA0AF3839290b0EF57AD6", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("polygonzkevm", "usdc-zkevm", "USDC", "USD Coin (Polygon zkEVM)", "0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("polygonzkevm", "usdt-zkevm", "USDT", "Tether USD (Polygon zkEVM)", "0x1E4a5963aBFD975d8c9021ce480b42188849D41d", 6, "tether", "#26A17B", cdn("usdt")),
  token("sei", "usdc-sei", "USDC", "USD Coin (Sei)", "0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("sonic", "usdc-sonic", "USDC", "USD Coin (Sonic)", "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("sonic", "usdt-sonic", "USDT", "Tether USD (Sonic)", "0x6047828dc181963ba44974801FF68e538dA5eaF9", 6, "tether", "#26A17B", cdn("usdt")),
  token("berachain", "usdc-bera", "USDC", "USD Coin (Berachain)", "0x549943e04f40284185054145c6E4e9568C1D3241", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("kava", "usdt-kava", "USDT", "Tether USD (Kava)", "0x919C1c267BC06a7039e03fcc2eF738525769109c", 6, "tether", "#26A17B", cdn("usdt")),
  token("core", "usdc-core", "USDC", "USD Coin (Core)", "0xa4151B2B3e269645181dCcF2D426cE75fcbDeca9", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("abstract", "usdc-abs", "USDC", "USD Coin (Abstract)", "0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("celo", "usdt-celo", "USDT", "Tether USD (Celo)", "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", 6, "tether", "#26A17B", cdn("usdt")),

  // Stablecoins on the non-EVM networks: Aptos (a fungible asset and a coin
  // type), NEAR (NEP-141), Sui (coin type) and Polkadot (a pallet-assets entry
  // on Asset Hub). Each address was read on its own chain before being listed.
  {
    ...token("aptos", "usdc-apt", "USDC", "USD Coin (Aptos)", "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b", 6, "usd-coin", "#2775CA", cdn("usdc")),
    fungibleAsset: true,
  },
  token("aptos", "usdt-apt", "USDT", "Tether USD (Aptos)", "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT", 6, "tether", "#26A17B", cdn("usdt")),
  token("near", "usdt-near", "USDT", "Tether USD (NEAR)", "usdt.tether-token.near", 6, "tether", "#26A17B", cdn("usdt")),
  token("near", "usdc-near", "USDC", "USD Coin (NEAR)", "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("sui", "usdc-sui", "USDC", "USD Coin (Sui)", "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", 6, "usd-coin", "#2775CA", cdn("usdc")),
  token("sui", "usdt-sui", "USDT", "Tether USD (Sui)", "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT", 6, "tether", "#26A17B", cdn("usdt")),
  token("polkadot", "usdt-dot", "USDT", "Tether USD (Polkadot)", "1984", 6, "tether", "#26A17B", cdn("usdt")),
  token("polkadot", "usdc-dot", "USDC", "USD Coin (Polkadot)", "1337", 6, "usd-coin", "#2775CA", cdn("usdc")),
];

// Botanix's own node is gone; the only node left (thirdweb) answers one call per
// request, so it would drag every scan down to single reads. BEVM reads again
// through its GEB mainnet node, so it is scanned like any other chain.
// Liquid has no indexer left that serves a bulk scan: liquid.network stopped
// answering and Blockstream refuses its burst, so L-BTC is read in the wallet
// itself (one address at a time) but not in the scanner.
// Dash's explorers demand minutes-long pacing now (chainz answers 429, insight
// sits behind a browser challenge), so every Dash read failed and every round
// waited on it. Dash is out of the scanner until a working indexer exists.
const OFFLINE_CHAINS = new Set(["botanix", "liquid", "dash"]);

export const SCAN_ASSETS = [...Object.keys(COINGECKO).map(native), ...TOKENS].filter(
  (asset) => !OFFLINE_CHAINS.has(asset.chain),
);

export const SCAN_CHAINS = [...new Set(SCAN_ASSETS.map((asset) => asset.chain))];