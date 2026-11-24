import { createFileRoute } from "@tanstack/react-router";
import { secrets } from "base44:runtime";

// Token discovery for the networks whose public indexer blocks this app. The
// free Etherscan V2 key does not include the "all token balances" endpoint, so a
// wallet is read in two steps: its transfer history names the tokens it has
// touched, then each of those is asked for its exact current balance.
const CHAIN_IDS = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  polygon: 137,
  gnosis: 100,
  optimism: 10,
};

const API = "https://api.etherscan.io/v2/api";
const TX_ROWS = 300; // transfer rows read to find the wallet's tokens
// Exact balances confirmed per wallet. Every confirmation is another call on the
// key, and the key is what caps a scan's speed, so only the tokens the transfer
// history says were received are confirmed.
const VERIFY_LIMIT = 3;

const isAddress = (value) => typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);

// One free Etherscan key allows five calls a second, and a wallet costs several,
// so the key is a list: ETHERSCAN_API_KEY may hold as many keys as you have,
// separated by commas or spaces, and the calls are spread over them in turn.
// Every extra key widens the scan in proportion.
function keyPool() {
  return String(secrets.get("ETHERSCAN_API_KEY") || "")
    .split(/[\s,;]+/)
    .filter(Boolean);
}

let keyCursor = 0;
const nextKey = (keys) => keys[keyCursor++ % keys.length];
const isLimited = (body) => /rate limit|max calls|max rate|too many/i.test(`${body?.result || ""} ${body?.message || ""}`);

/** One indexer call, moved to the next key when this one is out of calls. */
async function call(keys, chainId, action, address, extra = "") {
  let last = null;
  for (let attempt = 0; attempt < Math.min(Math.max(keys.length, 1), 4); attempt += 1) {
    const url = `${API}?chainid=${chainId}&module=account&action=${action}&address=${address}${extra}&apikey=${nextKey(keys)}`;
    const response = await fetch(url);
    if (response.status === 429) continue;
    if (!response.ok) throw new Error(`Indexer error (${response.status}).`);
    const body = await response.json().catch(() => null);
    if (isLimited(body)) {
      last = body;
      continue;
    }
    return body;
  }
  return last;
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
  return [...found.values()].filter((entry) => entry.net > 0n).slice(0, VERIFY_LIMIT);
}

async function tokensOf(request) {
  const keys = keyPool();
  if (!keys.length) return Response.json({ error: "No Etherscan key configured." }, { status: 503 });

  const params = new URL(request.url).searchParams;
  const chainId = CHAIN_IDS[params.get("chain")];
  const address = params.get("address") || "";
  if (!chainId) return Response.json({ error: "Unknown chain." }, { status: 400 });
  if (!isAddress(address)) return Response.json({ error: "Bad address." }, { status: 400 });

  const history = await call(keys, chainId, "tokentx", address, `&page=1&offset=${TX_ROWS}&sort=desc`);
  const rows = Array.isArray(history?.result) ? history.result : [];

  // A chain outside the key's plan is not a wallet holding nothing: it is
  // reported apart so the scan stops asking instead of reading it as empty.
  if (history?.status !== "1" && !rows.length) {
    const said = `${history?.result || ""} ${history?.message || ""}`;
    if (/pro endpoint|paid plan|upgrade|rate limit|max calls/i.test(said)) {
      return Response.json({ error: "This chain needs a paid Etherscan plan." }, { status: 402 });
    }
  }

  const tokens = [];
  for (const entry of candidatesFrom(rows, address)) {
    // The transfer history only says the token was touched: its exact balance
    // comes from the token contract itself.
    const payload = await call(
      keys,
      chainId,
      "tokenbalance",
      address,
      `&contractaddress=${entry.address}&tag=latest`,
    );
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

  return Response.json({ tokens }, { headers: { "cache-control": "no-store" } });
}

export const Route = createFileRoute("/api/token-discovery")({
  server: {
    handlers: {
      GET: ({ request }) => tokensOf(request),
      // The scan asks with a POST as well: a GET on /api/... can be served as a
      // module file by the dev server, which answered with source, not tokens.
      POST: ({ request }) => tokensOf(request),
    },
  },
});