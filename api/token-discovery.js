// Vercel function: token discovery for the networks whose public indexer blocks
// the browser. The free Etherscan key has no "all token balances" endpoint, so a
// wallet is read in two steps: its transfer history names the tokens it touched,
// then each is asked for its exact current balance.
const CHAIN_IDS = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  polygon: 137,
  gnosis: 100,
  optimism: 10,
};

const API = "https://api.etherscan.io/v2/api";
const TX_ROWS = 300;
const VERIFY_LIMIT = 8;

const isAddress = (value) => typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);

async function call(key, chainId, action, address, extra = "") {
  const url = `${API}?chainid=${chainId}&module=account&action=${action}&address=${address}${extra}&apikey=${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Indexer error (${response.status}).`);
  return response.json().catch(() => null);
}

/** Tokens this wallet received more of than it sent, newest transfers first. */
function candidatesFrom(rows, address) {
  const owner = address.toLowerCase();
  const found = new Map();
  for (const row of rows) {
    const contract = String(row?.contractAddress || "").toLowerCase();
    if (!contract) continue;
    const entry = found.get(contract) || {
      address: contract,
      symbol: String(row.tokenSymbol || "?").slice(0, 12),
      name: String(row.tokenName || row.tokenSymbol || "Unknown token").slice(0, 40),
      decimals: Number(row.tokenDecimal ?? 18),
      net: 0n,
    };
    const value = BigInt(row.value || "0");
    if (String(row.to || "").toLowerCase() === owner) entry.net += value;
    if (String(row.from || "").toLowerCase() === owner) entry.net -= value;
    found.set(contract, entry);
  }
  return [...found.values()].filter((entry) => entry.net > 0n).slice(0, 8);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });

  const key = process.env.ETHERSCAN_API_KEY;
  if (!key) return res.status(503).json({ error: "No Etherscan key configured." });

  const chainId = { ethereum: 1, base: 8453, arbitrum: 42161, polygon: 137, gnosis: 100, optimism: 10 }[
    req.query?.chain
  ];
  const address = req.query?.address || "";
  if (!chainId) return res.status(400).json({ error: "Unknown chain." });
  if (!isAddress(address)) return res.status(400).json({ error: "Bad address." });

  const history = await call(key, chainId, "tokentx", address, "&page=1&offset=300&sort=desc");
  const rows = Array.isArray(history?.result) ? history.result : [];

  if (history?.status !== "1" && !rows.length) {
    const said = `${history?.result || ""} ${history?.message || ""}`;
    if (/pro endpoint|paid plan|upgrade|rate limit|max calls/i.test(said)) {
      return res.status(402).json({ error: "This chain needs a paid Etherscan plan." });
    }
  }

  const tokens = [];
  for (const entry of candidatesFrom(rows, address)) {
    const payload = await call(key, chainId, "tokenbalance", address, `&contractaddress=${entry.address}&tag=latest`);
    const raw = Number(payload?.result);
    if (!Number.isFinite(raw) || raw <= 0) continue;
    const decimals = Number.isFinite(entry.decimals) ? entry.decimals : 18;
    tokens.push({
      address: entry.address,
      symbol: entry.symbol,
      name: entry.name,
      decimals,
      balance: raw / 10 ** decimals,
    });
  }

  res.setHeader("cache-control", "no-store");
  return res.status(200).json({ tokens });
}