// Self-contained provider reads for the Vercel deployment.
//
// Nothing here needs setting up: every provider is read through its public
// endpoint. A key in this project's Vercel environment variables is used when it
// exists (higher rate limits), and the public endpoint carries the read when it
// does not — so the deployment never depends on another backend.
//
// Optional Vercel env vars (Settings → Environment Variables):
//   TRONGRID_API_KEY  TONCENTER_API_KEY  HELIUS_API_KEY  DRPC_API_KEY
//   HIRO_API_KEY      ETHERSCAN_API_KEY  BLOCKFROST_PROJECT_ID

const MAX_BODY = 256 * 1024;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const env = (name) => process.env[name] || "";

export function send(res, status, text) {
  res.status(status);
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  return res.send(text);
}

const fail = (status, error) => ({ status, text: JSON.stringify({ error }) });

async function once(target, init) {
  try {
    const response = await fetch(target, init);
    return { status: response.status, text: await response.text() };
  } catch {
    return null;
  }
}

/** The first endpoint that answers, so a busy public node never ends a read. */
async function firstAnswer(targets, init) {
  let last = null;
  for (const target of targets) {
    const answer = await once(target, init);
    if (answer && answer.status >= 200 && answer.status < 300) return answer;
    if (answer) last = answer;
  }
  return last || fail(502, "Upstream unavailable.");
}

const post = (body) => ({ method: "POST", headers: { "content-type": "application/json" }, body });

// ---------------------------------------------------------------- TRON
const TRON_OPS = {
  account: "/wallet/getaccount",
  call: "/wallet/triggerconstantcontract",
};

export async function tronRead(query, raw) {
  const path = TRON_OPS[String(query?.op || "")];
  if (!path) return fail(400, "Unknown operation.");
  if (!raw || raw.length > MAX_BODY) return fail(400, "Bad request.");

  const key = env("TRONGRID_API_KEY");
  const headers = { "content-type": "application/json" };
  if (key) headers["TRON-PRO-API-KEY"] = key;

  return firstAnswer([`https://api.trongrid.io${path}`], { method: "POST", headers, body: raw });
}

// ---------------------------------------------------------------- TON
const isTonAddress = (value) =>
  typeof value === "string" && (/^[A-Za-z0-9_-]{46,50}$/.test(value) || /^-?\d+:[0-9a-fA-F]{64}$/.test(value));

export async function tonBalance(query) {
  const address = String(query?.address || "");
  if (!isTonAddress(address)) return fail(400, "Bad address.");

  const key = env("TONCENTER_API_KEY");
  const headers = key ? { "X-API-Key": key } : undefined;
  const answer = await firstAnswer(
    [`https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}`],
    headers ? { headers } : undefined,
  );
  if (answer.status < 300) return answer;

  // TonAPI answers the same question in nanoton, in the shape the app reads.
  const fallback = await once(`https://tonapi.io/v2/accounts/${encodeURIComponent(address)}`);
  if (fallback && fallback.status === 200) {
    try {
      const data = JSON.parse(fallback.text || "{}");
      if (data?.balance !== undefined) {
        return { status: 200, text: JSON.stringify({ ok: true, result: String(data.balance) }) };
      }
    } catch {
      // Fall through to the Toncenter answer.
    }
  }
  return answer;
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
  if (!raw || raw.length > MAX_BODY || !readsOnly(raw)) return fail(400, "Bad request.");

  const key = env("HELIUS_API_KEY");
  const targets = [
    key ? `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}` : null,
    "https://api.mainnet-beta.solana.com",
    "https://solana-rpc.publicnode.com",
  ].filter(Boolean);

  return firstAnswer(targets, post(raw));
}

// ---------------------------------------------------------------- EVM (dRPC + public nodes)
const EVM_ENDPOINTS = {
  ethereum: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
  bsc: ["https://bsc-rpc.publicnode.com", "https://binance.llamarpc.com", "https://bsc-dataseed.bnbchain.org"],
  base: ["https://base-rpc.publicnode.com", "https://mainnet.base.org", "https://base.llamarpc.com"],
  arbitrum: ["https://arbitrum-one-rpc.publicnode.com", "https://arb1.arbitrum.io/rpc"],
  polygon: ["https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com"],
  optimism: ["https://optimism-rpc.publicnode.com", "https://mainnet.optimism.io"],
  avalanche: ["https://avalanche-c-chain-rpc.publicnode.com", "https://api.avax.network/ext/bc/C/rpc"],
  linea: ["https://linea-rpc.publicnode.com", "https://rpc.linea.build"],
  scroll: ["https://scroll-rpc.publicnode.com", "https://rpc.scroll.io"],
  zksync: ["https://zksync-era-rpc.publicnode.com", "https://mainnet.era.zksync.io"],
  mantle: ["https://mantle-rpc.publicnode.com", "https://rpc.mantle.xyz"],
  celo: ["https://celo-rpc.publicnode.com", "https://forno.celo.org"],
  gnosis: ["https://gnosis-rpc.publicnode.com", "https://rpc.gnosischain.com"],
  cronos: ["https://cronos-evm-rpc.publicnode.com", "https://evm.cronos.org"],
  fantom: ["https://fantom-rpc.publicnode.com", "https://rpc.ftm.tools"],
  unichain: ["https://unichain-rpc.publicnode.com", "https://mainnet.unichain.org"],
  sonic: ["https://sonic-rpc.publicnode.com", "https://rpc.soniclabs.com"],
  sei: ["https://sei-evm-rpc.publicnode.com", "https://evm-rpc.sei-apis.com"],
  core: ["https://rpc.coredao.org", "https://core-rpc.publicnode.com"],
  "polygon-zkevm": ["https://polygon-zkevm-rpc.publicnode.com", "https://zkevm-rpc.com"],
};

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
  const network = String(query?.network || "");
  const publicNodes = EVM_ENDPOINTS[network];
  if (!publicNodes) return fail(400, "Unknown network.");
  if (!raw || raw.length > MAX_BODY || !evmReadsOnly(raw)) return fail(400, "Bad request.");

  const key = env("DRPC_API_KEY");
  const targets = [
    key ? `https://lb.drpc.live/${encodeURIComponent(network)}/${encodeURIComponent(key)}` : null,
    ...publicNodes,
  ].filter(Boolean);

  return firstAnswer(targets, post(raw));
}

// ---------------------------------------------------------------- Stacks
const isStacksAddress = (value) => /^S[PTMN][0-9A-Z]{20,60}$/.test(value || "");

export async function hiroBalances(query) {
  const address = String(query?.address || "");
  if (!isStacksAddress(address)) return fail(400, "Bad address.");

  const key = env("HIRO_API_KEY");
  return firstAnswer([`https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`], {
    headers: key ? { "x-api-key": key } : undefined,
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
  const answer = await once("https://api.koios.rest/api/v1/address_info", post(JSON.stringify({ _addresses: addresses })));
  if (answer && answer.status === 200) {
    try {
      const rows = JSON.parse(answer.text || "[]");
      const balances = {};
      for (const row of Array.isArray(rows) ? rows : []) {
        if (row?.address) balances[row.address] = String(row.balance ?? 0);
      }
      return { status: 200, text: JSON.stringify({ balances }) };
    } catch {
      // Fall through to the keyed indexer.
    }
  }

  const projectId = env("BLOCKFROST_PROJECT_ID");
  if (!projectId) return { status: 200, text: JSON.stringify({ balances: {} }) };

  const balances = {};
  let next = 0;
  const worker = async () => {
    while (next < addresses.length) {
      const address = addresses[next];
      next += 1;
      const read = await once(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`, {
        headers: { project_id: projectId },
      });
      if (!read) continue;
      if (read.status === 404) {
        balances[address] = "0";
        continue;
      }
      if (read.status !== 200) continue;
      try {
        const data = JSON.parse(read.text || "{}");
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
const ETH_CHAIN = { ethereum: 1, base: 8453, arbitrum: 42161, polygon: 137, gnosis: 100, optimism: 10 };

// Etherscan-compatible indexers that answer without a key.
const BLOCKSCOUT = {
  ethereum: "https://eth.blockscout.com",
  base: "https://base.blockscout.com",
  arbitrum: "https://arbitrum.blockscout.com",
  optimism: "https://optimism.blockscout.com",
  polygon: "https://polygon.blockscout.com",
  gnosis: "https://gnosis.blockscout.com",
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
  const chain = String(query?.chain || "");
  const chainId = ETH_CHAIN[chain];
  const address = String(query?.address || "");
  if (!chainId) return fail(400, "Unknown chain.");
  if (!isEvmAddress(address)) return fail(400, "Bad address.");

  const key = env("ETHERSCAN_API_KEY");
  const base = key
    ? `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=`
    : `${BLOCKSCOUT[chain]}/api?module=account&action=`;
  if (!base.startsWith("http")) return { status: 200, text: JSON.stringify({ tokens: [] }) };
  const suffix = key ? `&apikey=${encodeURIComponent(key)}` : "";

  const call = async (action, extra = "") => {
    const read = await once(`${base}${action}&address=${address}${extra}${suffix}`, {
      headers: { accept: "application/json", "user-agent": UA },
    });
    if (!read || read.status !== 200) return null;
    try {
      return JSON.parse(read.text);
    } catch {
      return null;
    }
  };

  const history = await call("tokentx", "&page=1&offset=300&sort=desc");
  const rows = Array.isArray(history?.result) ? history.result : [];
  // No history index for this chain: the scan still checks its known tokens.
  if (!rows.length) return { status: 200, text: JSON.stringify({ tokens: [] }) };

  const listed = [];
  for (const entry of candidatesFrom(rows, address)) {
    const payload = await call("tokenbalance", `&contractaddress=${entry.address}&tag=latest`);
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