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
const VERIFY_LIMIT = 8; // exact balances confirmed per wallet

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
  return [...found.values()].filter((entry) => entry.net > 0n).slice(0, VERIFY_LIMIT);
}

export const Route = createFileRoute("/api/token-discovery")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = secrets.get("ETHERSCAN_API_KEY");
        if (!key) return Response.json({ error: "No Etherscan key configured." }, { status: 503 });

        const params = new URL(request.url).searchParams;
        const chainId = CHAIN_IDS[params.get("chain")];
        const address = params.get("address") || "";
        if (!chainId) return Response.json({ error: "Unknown chain." }, { status: 400 });
        if (!isAddress(address)) return Response.json({ error: "Bad address." }, { status: 400 });

        const history = await call(
          key,
          chainId,
          "tokentx",
          address,
          `&page=1&offset=${TX_ROWS}&sort=desc`,
        );
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
          // The transfer history only says the token was touched: its exact
          // balance comes from the token contract itself.
          const payload = await call(
            key,
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
      },
    },
  },
});