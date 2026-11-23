// Chain reads whose provider key lives on the server, never in the browser.
//
// One function, seven providers: the Vercel deployment forwards its /api/... calls
// here, so a static host gets the keyed readers without holding a key of its own.
// Every URL is fixed and only balance reads are relayed, so this is not a proxy.
//
// Request shape (POST, JSON):
//   { provider: "tron", query: { op: "account" }, body: "<raw upstream body>" }
import { secrets } from "base44:runtime";

const MAX_BODY = 256 * 1024;

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

const TRON_OPS: Record<string, string> = {
  account: "/wallet/getaccount",
  call: "/wallet/triggerconstantcontract",
};

// Balance reads only: a key must never become a free general-purpose node.
const READ_METHODS = new Set([
  "eth_getbalance",
  "eth_call",
  "eth_blocknumber",
  "eth_chainid",
  "eth_gettransactioncount",
  "eth_estimategas",
  "eth_gasprice",
  "getmultipleaccounts",
  "getbalance",
  "getaccountinfo",
  "gettokenaccountsbyowner",
  "gettokenaccountbalance",
  "getlatestblockhash",
]);

// The networks the dRPC key serves, spelled as dRPC names them.
const DRPC_NETWORKS = new Set([
  "ethereum",
  "bsc",
  "base",
  "arbitrum",
  "polygon",
  "optimism",
  "avalanche",
  "linea",
  "scroll",
  "zksync",
  "mantle",
  "celo",
  "gnosis",
  "cronos",
  "fantom",
  "unichain",
  "sonic",
  "sei",
  "core",
  "polygon-zkevm",
]);

const ETH_CHAIN: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  polygon: 137,
  gnosis: 100,
  optimism: 10,
};

const isCardanoAddress = (value: string) => /^addr1[0-9a-z]{20,120}$/i.test(value);
const isEvmAddress = (value: string) => /^0x[0-9a-fA-F]{40}$/.test(value);

type Params = Map<string, string>;

function readsOnly(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.every(
      (call: any) => call && typeof call.method === "string" && READ_METHODS.has(String(call.method).toLowerCase()),
    );
  } catch {
    return false;
  }
}

async function relay(target: string, init: RequestInit) {
  const response = await fetch(target, init);
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function tron(params: Params, raw: string) {
  const key = secrets.get("TRONGRID_API_KEY");
  if (!key) return json({ error: "No TronGrid key configured." }, 503);
  const path = TRON_OPS[params.get("op") || ""];
  if (!path) return json({ error: "Unknown operation." }, 400);
  if (!raw || raw.length > MAX_BODY) return json({ error: "Bad request." }, 400);
  return relay(`https://api.trongrid.io${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "TRON-PRO-API-KEY": String(key) },
    body: raw,
  });
}

async function ton(params: Params) {
  const key = secrets.get("TONCENTER_API_KEY");
  if (!key) return json({ error: "No Toncenter key configured." }, 503);
  const address = params.get("address") || "";
  if (!/^[A-Za-z0-9_-]{46,50}$/.test(address) && !/^-?\d+:[0-9a-fA-F]{64}$/.test(address)) {
    return json({ error: "Bad address." }, 400);
  }
  return relay(`https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}`, {
    headers: { "X-API-Key": String(key) },
  });
}

async function solana(raw: string) {
  const key = secrets.get("HELIUS_API_KEY");
  if (!key) return json({ error: "No Helius key configured." }, 503);
  if (!raw || raw.length > MAX_BODY || !readsOnly(raw)) return json({ error: "Bad request." }, 400);
  return relay(`https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(String(key))}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
  });
}

async function drpc(params: Params, raw: string) {
  const key = secrets.get("DRPC_API_KEY");
  if (!key) return json({ error: "No dRPC key configured." }, 503);
  const network = params.get("network") || "";
  if (!DRPC_NETWORKS.has(network)) return json({ error: "Unknown network." }, 400);
  if (!raw || raw.length > MAX_BODY || !readsOnly(raw)) return json({ error: "Bad request." }, 400);
  return relay(`https://lb.drpc.live/${encodeURIComponent(network)}/${encodeURIComponent(String(key))}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
  });
}

async function hiro(params: Params) {
  const key = secrets.get("HIRO_API_KEY");
  if (!key) return json({ error: "No Hiro key configured." }, 503);
  const address = params.get("address") || "";
  if (!/^S[PTMN][0-9A-Z]{20,60}$/.test(address)) return json({ error: "Bad address." }, 400);
  return relay(`https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`, {
    headers: { "x-api-key": String(key) },
  });
}

async function cardano(raw: string) {
  let body: any = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = {};
  }
  const asked = Array.isArray(body?.addresses) ? body.addresses.map((item: unknown) => String(item)) : [];
  const addresses = [...new Set(asked.filter(isCardanoAddress))].slice(0, 50);
  if (!addresses.length) return json({ balances: {} });

  try {
    const response = await fetch("https://api.koios.rest/api/v1/address_info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ _addresses: addresses }),
    });
    if (response.ok) {
      const rows = await response.json().catch(() => []);
      const balances: Record<string, string> = {};
      for (const row of Array.isArray(rows) ? rows : []) {
        if (row?.address) balances[row.address] = String(row.balance ?? 0);
      }
      return json({ balances });
    }
  } catch {
    // Koios did not answer: the keyed indexer below carries the read.
  }

  const projectId = secrets.get("BLOCKFROST_PROJECT_ID");
  if (!projectId) return json({ balances: {}, error: "indexer unavailable" }, 502);

  const balances: Record<string, string> = {};
  let next = 0;
  const worker = async () => {
    while (next < addresses.length) {
      const address = addresses[next];
      next += 1;
      try {
        const response = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`, {
          headers: { project_id: String(projectId) },
        });
        if (response.status === 404) {
          balances[address] = "0";
          continue;
        }
        if (!response.ok) continue;
        const data: any = await response.json().catch(() => null);
        const lovelace = (Array.isArray(data?.amount) ? data.amount : []).find((item: any) => item.unit === "lovelace");
        if (lovelace?.quantity !== undefined) balances[address] = String(lovelace.quantity);
      } catch {
        // Left out of the map: a missing address reads as zero by the caller.
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(8, addresses.length) }, worker));
  return json({ balances });
}

/** Tokens this wallet received more of than it sent, newest transfers first. */
function candidatesFrom(rows: any[], address: string) {
  const owner = address.toLowerCase();
  const found = new Map<string, any>();
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

// The free Etherscan key has no "all token balances" endpoint, so a wallet is read
// in two steps: its transfer history names the tokens it touched, then each of
// those is asked for its exact current balance.
async function tokens(params: Params) {
  const key = secrets.get("ETHERSCAN_API_KEY");
  if (!key) return json({ error: "No Etherscan key configured." }, 503);

  const chainId = ETH_CHAIN[params.get("chain") || ""];
  const address = params.get("address") || "";
  if (!chainId) return json({ error: "Unknown chain." }, 400);
  if (!isEvmAddress(address)) return json({ error: "Bad address." }, 400);

  const call = async (action: string, extra = "") => {
    const target =
      `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=${action}` +
      `&address=${address}${extra}&apikey=${encodeURIComponent(String(key))}`;
    const response = await fetch(target);
    if (!response.ok) throw new Error(`Indexer error (${response.status}).`);
    return response.json().catch(() => null);
  };

  const history: any = await call("tokentx", "&page=1&offset=300&sort=desc");
  const rows = Array.isArray(history?.result) ? history.result : [];

  // A chain outside the key's plan is not a wallet holding nothing: it is
  // reported apart, so the scan stops asking instead of reading it as empty.
  if (history?.status !== "1" && !rows.length) {
    const said = `${history?.result || ""} ${history?.message || ""}`;
    if (/pro endpoint|paid plan|upgrade|rate limit|max calls/i.test(said)) {
      return json({ error: "This chain needs a paid Etherscan plan." }, 402);
    }
  }

  const listed = [];
  for (const entry of candidatesFrom(rows, address)) {
    const payload: any = await call("tokenbalance", `&contractaddress=${entry.address}&tag=latest`).catch(() => null);
    const raw = Number(payload?.result);
    if (!Number.isFinite(raw) || raw <= 0) continue;
    const decimals = Number.isFinite(entry.decimals) ? entry.decimals : 18;
    listed.push({
      address: entry.address,
      symbol: entry.symbol,
      name: entry.name,
      decimals,
      balance: raw / 10 ** decimals,
    });
  }

  return json({ tokens: listed });
}

export default async function (req: Request): Promise<Response> {
  const url = new URL(req.url);
  let envelope: any = {};
  if (req.method === "POST") envelope = await req.json().catch(() => ({}));

  const provider = String(envelope?.provider || url.searchParams.get("provider") || "");
  const params: Params = new Map(url.searchParams as any);
  for (const [name, value] of Object.entries(envelope?.query || {})) {
    if (value !== undefined && value !== null) params.set(name, String(value));
  }
  const raw = typeof envelope?.body === "string" ? envelope.body : "";

  switch (provider) {
    case "tron":
      return tron(params, raw);
    case "ton":
      return ton(params);
    case "solana":
      return solana(raw);
    case "drpc":
      return drpc(params, raw);
    case "hiro":
      return hiro(params);
    case "cardano":
      return cardano(raw);
    case "tokens":
      return tokens(params);
    default:
      return json({ error: "Unknown provider." }, 400);
  }
}