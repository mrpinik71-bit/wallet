// Finds the tokens an address actually holds on a network, including airdropped
// meme tokens that are not in this wallet's own catalog. Every source here is a
// public, keyless endpoint read straight from the browser.

// ERC-20 balances from each chain's public Blockscout indexer.
export const DISCOVERY_CHAINS = {
  ethereum: "https://eth.blockscout.com",
  base: "https://base.blockscout.com",
  optimism: "https://optimism.blockscout.com",
  arbitrum: "https://arbitrum.blockscout.com",
  polygon: "https://polygon.blockscout.com",
  gnosis: "https://gnosis.blockscout.com",
};

// BEP-20 on BNB Chain has no Blockscout, so it uses the public Binplorer indexer.
const BSC_INDEXER = "https://api.binplorer.com";
// TON jettons, straight from the network's public API.
const TON_INDEXER = "https://tonapi.io/v2";
// SPL tokens need an RPC that answers indexed queries, so the first one that does wins.
const SOLANA_RPCS = ["https://api.mainnet-beta.solana.com", "https://solana-rpc.publicnode.com"];
const SOLANA_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
// SPL accounts carry no symbol, so the pair listing names (and prices) them.
const DEXSCREENER = "https://api.dexscreener.com/latest/dex/tokens";

const PALETTE = ["#7A9CF7", "#B07CF7", "#F79C7A", "#6FD3B8", "#F7D07A", "#7AD1F7", "#F77AB0"];

/** A stable colour per symbol so the same token keeps its badge. */
export function colorForToken(symbol = "") {
  let hash = 0;
  for (let index = 0; index < symbol.length; index += 1) hash = (hash * 31 + symbol.charCodeAt(index)) % 9973;
  return PALETTE[hash % PALETTE.length];
}

/** A raw on-chain amount as a human balance, using the token's own decimals. */
function asAmount(raw, decimals) {
  const places = Number(decimals);
  const value = Number(raw || 0) / 10 ** (Number.isFinite(places) ? places : 0);
  return Number.isFinite(value) ? value : 0;
}

/** Keeps only real, held tokens, largest balance first. */
function finish(tokens, limit) {
  return tokens
    .filter((token) => token.address && token.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}

async function blockscoutTokens(chainId, address, limit) {
  const base = DISCOVERY_CHAINS[chainId];
  const response = await fetch(`${base}/api/v2/addresses/${address}/token-balances`);
  if (!response.ok) throw new Error(`Token list unavailable (${response.status}).`);
  const rows = await response.json();

  const tokens = (Array.isArray(rows) ? rows : []).map((row) => {
    const token = row?.token || {};
    const decimals = Number(token.decimals ?? 18);
    return {
      address: token.address || token.address_hash || "",
      symbol: String(token.symbol || "?").slice(0, 12),
      name: String(token.name || token.symbol || "Unknown token").slice(0, 40),
      decimals: Number.isFinite(decimals) ? decimals : 18,
      balance: asAmount(row?.value, decimals),
      logo: token.icon_url || "",
      erc20: !token.type || String(token.type).toUpperCase() === "ERC-20",
    };
  });

  return finish(tokens.filter((token) => token.erc20), limit);
}

async function bscTokens(address, limit) {
  const response = await fetch(`${BSC_INDEXER}/getAddressInfo/${address}?apiKey=freekey`);
  if (!response.ok) throw new Error(`Token list unavailable (${response.status}).`);
  const data = await response.json();

  const tokens = (data?.tokens || []).map((row) => {
    const info = row?.tokenInfo || {};
    const decimals = Number(info.decimals ?? 18);
    return {
      address: info.address || "",
      symbol: String(info.symbol || "?").slice(0, 12),
      name: String(info.name || info.symbol || "Unknown token").slice(0, 40),
      decimals: Number.isFinite(decimals) ? decimals : 18,
      balance: asAmount(row.rawBalance ?? row.balance, decimals),
      logo: info.image || "",
    };
  });

  return finish(tokens, limit);
}

/** Symbol and name for a batch of SPL mints, from their trading pairs. */
async function solanaMetadata(mints) {
  const found = new Map();
  for (let start = 0; start < mints.length; start += 25) {
    const slice = mints.slice(start, start + 25);
    try {
      const response = await fetch(`${DEXSCREENER}/${slice.join(",")}`);
      if (!response.ok) continue;
      const data = await response.json();
      for (const pair of data?.pairs || []) {
        for (const side of [pair?.baseToken, pair?.quoteToken]) {
          if (!side?.address || found.has(side.address)) continue;
          found.set(side.address, {
            symbol: String(side.symbol || "?").slice(0, 12),
            name: String(side.name || side.symbol || "Unknown token").slice(0, 40),
          });
        }
      }
    } catch {
      // A missing listing only costs the symbol, never the balance.
    }
  }
  return found;
}

async function solanaTokens(address, limit) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getTokenAccountsByOwner",
    params: [address, { programId: SOLANA_TOKEN_PROGRAM }, { encoding: "jsonParsed" }],
  });

  let accounts = null;
  for (const url of SOLANA_RPCS) {
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body });
      const data = await response.json();
      if (Array.isArray(data?.result?.value)) {
        accounts = data.result.value;
        break;
      }
    } catch {
      // This node refused the indexed query: the next one gets it.
    }
  }
  if (!accounts) return [];

  // One mint can sit in several token accounts, so they are added together.
  const held = new Map();
  for (const account of accounts) {
    const info = account?.account?.data?.parsed?.info;
    const mint = info?.mint;
    const balance = Number(info?.tokenAmount?.uiAmount || 0);
    if (!mint || !(balance > 0)) continue;
    const seen = held.get(mint);
    if (seen) seen.balance += balance;
    else held.set(mint, { address: mint, decimals: Number(info?.tokenAmount?.decimals || 0), balance });
  }
  if (!held.size) return [];

  // Only mints with a trading pair can be named, and those are the ones a wallet
  // actually cares about seeing.
  const meta = await solanaMetadata([...held.keys()]);
  const tokens = [...held.values()]
    .filter((token) => meta.has(token.address))
    .map((token) => ({ ...token, ...meta.get(token.address), logo: "" }));

  return finish(tokens, limit);
}

async function tonTokens(address, limit) {
  const response = await fetch(`${TON_INDEXER}/accounts/${encodeURIComponent(address)}/jettons?currencies=usd`);
  if (!response.ok) throw new Error(`Token list unavailable (${response.status}).`);
  const data = await response.json();

  const tokens = (data?.balances || []).map((row) => {
    const jetton = row?.jetton || {};
    const decimals = Number(jetton.decimals ?? 9);
    return {
      address: jetton.address || "",
      symbol: String(jetton.symbol || "?").slice(0, 12),
      name: String(jetton.name || jetton.symbol || "Unknown token").slice(0, 40),
      decimals: Number.isFinite(decimals) ? decimals : 9,
      balance: asAmount(row?.balance, decimals),
      logo: jetton.image || "",
    };
  });

  return finish(tokens, limit);
}

/** Every token with a balance on this address, largest first. */
export async function discoverTokens(chainId, address, limit = 40) {
  if (!address) return [];
  if (DISCOVERY_CHAINS[chainId]) return blockscoutTokens(chainId, address, limit);
  if (chainId === "bsc") return bscTokens(address, limit);
  if (chainId === "solana") return solanaTokens(address, limit);
  if (chainId === "ton") return tonTokens(address, limit);
  return [];
}

/** The networks whose tokens are discovered on top of the wallet's own catalog. */
export const DISCOVERY_NETWORKS = [...Object.keys(DISCOVERY_CHAINS), "bsc", "solana", "ton"];