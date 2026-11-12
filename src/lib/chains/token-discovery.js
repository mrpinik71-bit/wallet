// Finds the tokens an address actually holds on an EVM network, including
// airdropped meme tokens that are not in this wallet's own catalog. Read from
// the public Blockscout indexer of each chain — no key, no server, browser only.

export const DISCOVERY_CHAINS = {
  ethereum: "https://eth.blockscout.com",
  base: "https://base.blockscout.com",
  optimism: "https://optimism.blockscout.com",
  arbitrum: "https://arbitrum.blockscout.com",
  polygon: "https://polygon.blockscout.com",
  gnosis: "https://gnosis.blockscout.com",
};

const PALETTE = ["#7A9CF7", "#B07CF7", "#F79C7A", "#6FD3B8", "#F7D07A", "#7AD1F7", "#F77AB0"];

/** A stable colour per symbol so the same token keeps its badge. */
export function colorForToken(symbol = "") {
  let hash = 0;
  for (let index = 0; index < symbol.length; index += 1) hash = (hash * 31 + symbol.charCodeAt(index)) % 9973;
  return PALETTE[hash % PALETTE.length];
}

/** Every ERC-20 with a balance on this address, largest first. */
export async function discoverTokens(chainId, address, limit = 40) {
  const base = DISCOVERY_CHAINS[chainId];
  if (!base || !address) return [];

  const response = await fetch(`${base}/api/v2/addresses/${address}/token-balances`);
  if (!response.ok) throw new Error(`Token list unavailable (${response.status}).`);

  const rows = await response.json();
  const tokens = (Array.isArray(rows) ? rows : []).map((row) => {
    const token = row?.token || {};
    const decimals = Number(token.decimals ?? 18);
    const balance = Number(row?.value || 0) / 10 ** (Number.isFinite(decimals) ? decimals : 18);
    return {
      address: token.address || "",
      symbol: (token.symbol || "?").slice(0, 12),
      name: (token.name || token.symbol || "Unknown token").slice(0, 40),
      decimals: Number.isFinite(decimals) ? decimals : 18,
      balance,
      logo: token.icon_url || "",
      erc20: !token.type || String(token.type).toUpperCase() === "ERC-20",
    };
  });

  return tokens
    .filter((token) => token.erc20 && token.address && token.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}