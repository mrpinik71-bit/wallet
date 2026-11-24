// Self-contained provider reads for the Vercel deployment.
//
// Every key comes from this project's own Vercel environment variables, so the
// deployment never calls another backend. When a key has not been set, the read
// is forwarded to the app's relay so the deployment keeps working as before.
//
// Vercel → Project → Settings → Environment Variables:
//   TRONGRID_API_KEY      TRON (TRX + USDT)
//   TONCENTER_API_KEY     TON (TON + USDT)
//   HELIUS_API_KEY        Solana
//   DRPC_API_KEY          every EVM network
//   HIRO_API_KEY          Stacks
//   ETHERSCAN_API_KEY     token discovery (ETH, BNB, Base …)
//   BLOCKFROST_PROJECT_ID Cardano (only if the public indexer is busy)

const RELAY = "https://glorious-vault-chain-core.base44.app/functions/chainRelay";
const MAX_BODY = 256 * 1024;

const env = (name) => process.env[name] || "";

export function send(res, status, text) {
  res.status(status);
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  return res.send(text);
}

const fail = (status, error) => ({ status, text: JSON.stringify({ error }) });

async function upstream(target, init) {
  try {
    const response = await fetch(target, init);
    return { status: response.status, text: await response.text() };
  } catch {
    return fail(502, "Upstream unavailable.");
  }
}

/** Only used when this deployment has no key of its own for a provider. */
async function relay(envelope) {
  try {
    const response = await fetch(RELAY, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(envelope),
    });
    return { status: response.status, text: await response.text() };
  } catch {
    return fail(502, "Upstream unavailable.");
  }
}

// ---------------------------------------------------------------- TRON
const TRON_OPS = {
  account: "/wallet/getaccount",
  call: "/wallet/triggerconstantcontract",
};

export async function tronRead(query, raw) {
  const key = env("TRONGRID_API_KEY");
  if (!key) return relay({ provider: "tron", query, body: raw });

  const path = TRON_OPS[String(query?.op || "")];
  if (!path) return fail(400, "Unknown operation.");
  if (!raw || raw.length > MAX_BODY) return fail(400, "Bad request.");

  return upstream(`https://api.trongrid.io${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "TRON-PRO-API-KEY": key },
    body: raw,
  });
}

// ---------------------------------------------------------------- TON
const isTonAddress = (value) =>
  typeof value === "string" && (/^[A-Za-z0-9_-]{46,50}$/.test(value) || /^-?\d+:[0-9a-fA-F]{64}$/.test(value));

export async function tonBalance(query) {
  const key = env("TONCENTER_API_KEY");
  const address = String(query?.address || "");
  if (!key) return relay({ provider: "ton", query: { address }, body: "" });
  if (!isTonAddress(address)) return fail(400, "Bad address.");

  return upstream(`https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}`, {
    headers: { "X-API-Key": key },
  });
}

// ---------------------------------------------------------------- Solana
const READ_METHODS = new Set([
  "getmultipleaccounts",
  "getbalance",
  "getaccountinfo",
  "gettokenaccountsbyowner",
  "gettokenaccountbalance",
  "getlatestblockhash",
]);

function readsOnly(raw) {
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.every(
      (call) => call && typeof call.method === "string" && READ_METHODS.has(String(call.method).toLowerCase()),
    );
  } catch {
    return false;
  }
}

export async function solanaRpc(raw) {
  const key = env("HELIUS_API_KEY");
  if (!key) return relay({ provider: "solana", query: {}, body: raw });
  if (!raw || raw.length > MAX_BODY || !readsOnly(raw)) return fail(400, "Bad request.");

  return upstream(`https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
  });
}

// ---------------------------------------------------------------- dRPC (EVM)
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

const EVM_READS = new Set([
  "eth_getbalance",
  "eth_call",
  "eth_blocknumber",
  "eth_chainid",
  "eth_gettransactioncount",
  "eth_estimategas",
  "eth_gasprice",
]);

function evmReadsOnly(raw) {
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.every(
      (call) => call && typeof call.method === "string" && EVM_READS.has(String(call.method).toLowerCase()),
    );
  } catch {
    return false;
  }
}

export async function drpcRead(query, raw) {
  const key = env("DRPC_API_KEY");
  if (!key) return relay({ provider: "drpc", query, body: raw });

  const network = String(query?.network || "");
  if (!DRPC_NETWORKS.has(network)) return fail(400, "Unknown network.");
  if (!raw || raw.length > MAX_BODY || !evmReadsOnly(raw)) return fail(400, "Bad request.");

  return upstream(`https://lb.drpc.live/${encodeURIComponent(network)}/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
  });
}

// ---------------------------------------------------------------- Stacks
const isStacksAddress = (value) => /^S[PTMN][0-9A-Z]{20,60}$/.test(value || "");

export async function hiroBalances(query) {
  const key = env("HIRO_API_KEY");
  const address = String(query?.address || "");
  if (!key) return relay({ provider: "hiro", query: { address }, body: "" });
  if (!isStacksAddress(address)) return fail(400, "Bad address.");

  return upstream(`https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`, {
    headers: { "x-api-key": key },
  });
}

// ---------------------------------------------------------------- Cardano
const isCardanoAddress = (value) => /^addr1[0-9a-z]{20,120}$/i.test(value);

export async function cardanoBalances(raw) {
  let body = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = {};
  }

  const asked = Array.isArray(body?.addresses) ? body.addresses.map((item) => String(item)) : [];
  const addresses = [...new Set(asked.filter(isCardanoAddress))].slice(0, 50);
  if (!addresses.length) return { status: 200, text: JSON.stringify({ balances: {} }) };

  // Koios answers without any key, so Cardano never depends on one.
  try {
    const response = await fetch("https://api.koios.rest/api/v1/address_info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ _addresses: addresses }),
    });
    if (response.ok) {
      const rows = await response.json().catch(() => []);
      const balances = {};
      for (const row of Array.isArray(rows) ? rows : []) {
        if (row?.address) balances[row.address] = String(row.balance ?? 0);
      }
      return { status: 200, text: JSON.stringify({ balances }) };
    }
  } catch {
    // Koios did not answer: the keyed indexer below carries the read.
  }

  const projectId = env("BLOCKFROST_PROJECT_ID");
  if (!projectId) return { status: 200, text: JSON.stringify({ balances: {} }) };

  const balances = {};
  let next = 0;
  const worker = async () => {
    while (next < addresses.length) {
      const address = addresses[next];
      next += 1;
      try {
        const response = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`, {
          headers: { project_id: projectId },
        });
        if (response.status === 404) {
          balances[address] = "0";
          continue;
        }
        if (!response.ok) continue;
        const data = await response.json().catch(() => null);
        const lovelace = (Array.isArray(data?.amount) ? data.amount : []).find((item) => item.unit === "lovelace");
        if (lovelace?.quantity !== undefined) balances[address] = String(lovelace.quantity);
      } catch {
        // Left out of the map: a missing address reads as zero by the caller.
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(8, addresses.length) }, worker));
  return { status: 200, text: JSON.stringify({ balances }) };
}

// ---------------------------------------------------------------- Token discovery
const ETH_CHAIN = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  polygon: 137,
  gnosis: 100,
  optimism: 10,
};

const isEvmAddress = (value) => /^0x[0-9a-fA-F]{40}$/.test(value);

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

export async function tokenDiscovery(query) {
  const key = env("ETHERSCAN_API_KEY");
  if (!key) return relay({ provider: "tokens", query, body: "" });

  const chainId = ETH_CHAIN[String(query?.chain || "")];
  const address = String(query?.address || "");
  if (!chainId) return fail(400, "Unknown chain.");
  if (!isEvmAddress(address)) return fail(400, "Bad address.");

  const call = async (action, extra = "") => {
    const target =
      `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=${action}` +
      `&address=${address}${extra}&apikey=${encodeURIComponent(key)}`;
    const response = await fetch(target);
    if (!response.ok) throw new Error(`Indexer error (${response.status}).`);
    return response.json().catch(() => null);
  };

  let history = null;
  try {
    history = await call("tokentx", "&page=1&offset=300&sort=desc");
  } catch {
    return fail(502, "Indexer unavailable.");
  }

  const rows = Array.isArray(history?.result) ? history.result : [];
  if (history?.status !== "1" && !rows.length) {
    const said = `${history?.result || ""} ${history?.message || ""}`;
    if (/pro endpoint|paid plan|upgrade|rate limit|max calls/i.test(said)) {
      return fail(402, "This chain needs a paid Etherscan plan.");
    }
  }

  const listed = [];
  for (const entry of candidatesFrom(rows, address)) {
    const payload = await call("tokenbalance", `&contractaddress=${entry.address}&tag=latest`).catch(() => null);
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

  return { status: 200, text: JSON.stringify({ tokens: listed }) };
}