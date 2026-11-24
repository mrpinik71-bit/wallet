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

/** A 200 that carries only an error is a refusal, not an answer. */
function refused(answer) {
  try {
    const body = JSON.parse(answer.text);
    if (Array.isArray(body)) return body.length > 0 && body.every((call) => call && call.error);
    return Boolean(body && body.error);
  } catch {
    return false;
  }
}

/**
 * Runs these tasks a few at a time. A wide batch is answered by many small
 * upstream requests, and firing all of them at once is exactly what a gateway
 * refuses: the call then spends its whole life in 429s and the deployment times
 * it out, which reads as a failed chain for every wallet in that batch.
 */
async function pooled(items, limit, run) {
  const out = new Array(items.length);
  let cursor = 0;
  const lanes = Math.max(1, Math.min(limit, items.length));
  await Promise.all(
    Array.from({ length: lanes }, async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        out[index] = await run(items[index], index);
      }
    }),
  );
  return out;
}

// How many upstream requests one relay call keeps in flight. Every extra key is
// another budget to spend, so the burst widens with the key list — a single key
// starts narrow instead of burying it.
const burstFor = (candidates) => {
  const keys = candidates.filter((candidate) => candidate.key).length;
  return Math.min(24, Math.max(6, keys * 4));
};

/** The first endpoint that answers, so a busy public node never ends a read. */
async function firstAnswer(targets, init) {
  let last = null;
  for (const target of targets) {
    const answer = await once(target, init);
    if (answer && answer.status >= 200 && answer.status < 300 && !refused(answer)) return answer;
    if (answer) last = answer;
  }
  return last || fail(502, "Upstream unavailable.");
}

const post = (body) => ({ method: "POST", headers: { "content-type": "application/json" }, body });

// Every provider key may hold a list, separated by commas or spaces: several
// free keys then add up to one wider lane instead of one narrow one. A key that
// refuses is rested and the next one carries the read, so one busy key never
// ends a chain read.
const keysOf = (name) => env(name).split(/[\s,]+/).filter(Boolean);
const keyRest = new Map();
let keyCursor = 0;

function orderedKeys(name) {
  const list = keysOf(name);
  if (list.length < 2) return list;
  const now = Date.now();
  const live = list.filter((key) => (keyRest.get(key) || 0) <= now);
  const usable = live.length ? live : list;
  // Round-robin, so the load of a scan is spread over every key instead of
  // landing on the first one until it refuses.
  keyCursor = (keyCursor + 1) % usable.length;
  return [...usable.slice(keyCursor), ...usable.slice(0, keyCursor)];
}

/** A key that refused is rested: a 429 for a moment, a dead key for a long while. */
function restKey(key, status) {
  if (!key) return;
  if (status === 429) keyRest.set(key, Date.now() + 20000);
  else if (status === 401 || status === 402 || status === 403) keyRest.set(key, Date.now() + 900000);
}

/** The first candidate that answers with a real result; a refusal rests its key. */
async function firstOf(candidates, init) {
  let last = null;
  for (const candidate of candidates) {
    const request = candidate.headers
      ? { ...init, headers: { ...(init?.headers || {}), ...candidate.headers } }
      : init;
    const answer = await once(candidate.url, request);
    if (!answer) continue;
    if (answer.status >= 200 && answer.status < 300 && !refused(answer)) return answer;
    restKey(candidate.key, answer.status);
    last = answer;
  }
  return last || fail(502, "Upstream unavailable.");
}

// A free plan caps one JSON-RPC batch at a few calls, so a wide batch is split
// into chunks the plan accepts and the answers are merged back in call order.
// Without this the gateway refused the whole batch and the read fell through to
// a public node, which throttles a scan — the reason EVM chains slowed down.
const batchCap = new Map();

async function rpcAnswer(provider, candidates, raw, splitAt) {
  let calls = null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) calls = parsed;
  } catch {
    calls = null;
  }
  if (!calls) return firstOf(candidates, post(raw));

  const known = batchCap.get(provider);
  if (!known || calls.length <= known) {
    const answer = await firstOf(candidates, post(raw));
    // A refused wide batch: remember the width this plan accepts and split.
    if (calls.length > splitAt && answer.status === 400) batchCap.set(provider, splitAt);
    else return answer;
  }

  const size = batchCap.get(provider) || splitAt;
  const chunks = [];
  for (let index = 0; index < calls.length; index += size) chunks.push(calls.slice(index, index + size));
  const answers = await pooled(chunks, burstFor(candidates), async (chunk, position) => {
    // Every chunk starts on a different key, so a wide batch is spread over
    // the whole key list instead of landing on the first one.
    const turn = candidates.length > 1 ? position % candidates.length : 0;
    const order = turn ? [...candidates.slice(turn), ...candidates.slice(0, turn)] : candidates;
    const answer = await firstOf(order, post(JSON.stringify(chunk)));
    if (answer && answer.status < 300) return answer;
    // A chunk that was refused is asked once more starting on the next key
    // instead of being dropped: a missing answer used to read as a failed chain
    // for every wallet in that part of the batch.
    if (candidates.length < 2) return answer;
    return firstOf([...candidates.slice(1), candidates[0]], post(JSON.stringify(chunk)));
  });
  const merged = [];
  for (const answer of answers) {
    if (!answer || answer.status >= 300) continue;
    try {
      const parsed = JSON.parse(answer.text);
      if (Array.isArray(parsed)) merged.push(...parsed);
    } catch {
      // This chunk did not answer; the rest of the batch still stands.
    }
  }
  if (!merged.length) return answers.find((answer) => answer && answer.status >= 300) || fail(502, "Upstream unavailable.");
  merged.sort((a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0));
  return { status: 200, text: JSON.stringify(merged) };
}

// ---------------------------------------------------------------- TRON
const TRON_OPS = {
  account: "/wallet/getaccount",
  call: "/wallet/triggerconstantcontract",
};

export async function tronRead(query, raw) {
  const path = TRON_OPS[String(query?.op || "")];
  if (!path) return fail(400, "Unknown operation.");
  if (!raw || raw.length > MAX_BODY) return fail(400, "Bad request.");

  const candidates = orderedKeys("TRONGRID_API_KEY").map((key) => ({
    url: `https://api.trongrid.io${path}`,
    key,
    headers: { "TRON-PRO-API-KEY": key },
  }));
  // No key saved: the provider's own public endpoint carries the read.
  if (!candidates.length) candidates.push({ url: `https://api.trongrid.io${path}` });

  return firstOf(candidates, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
  });
}

// ---------------------------------------------------------------- TON
const isTonAddress = (value) =>
  typeof value === "string" && (/^[A-Za-z0-9_-]{46,50}$/.test(value) || /^-?\d+:[0-9a-fA-F]{64}$/.test(value));

export async function tonBalance(query) {
  const address = String(query?.address || "");
  if (!isTonAddress(address)) return fail(400, "Bad address.");

  const url = `https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}`;
  const candidates = orderedKeys("TONCENTER_API_KEY").map((key) => ({ url, key, headers: { "X-API-Key": key } }));
  // Toncenter answers without a key too, so it is asked either way.
  candidates.push({ url });
  const answer = await firstOf(candidates);
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

  const publicNodes = ["https://api.mainnet-beta.solana.com", "https://solana-rpc.publicnode.com"];
  const candidates = orderedKeys("HELIUS_API_KEY").map((key) => ({
    url: `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`,
    key,
  }));
  for (const url of publicNodes) candidates.push({ url });

  // Helius takes a hundred accounts per read, which is the widest batch the
  // app ever sends, so a wide read is not split here.
  return rpcAnswer("helius", candidates, raw, 100);
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

  const candidates = orderedKeys("DRPC_API_KEY").map((key) => ({
    url: `https://lb.drpc.live/${encodeURIComponent(network)}/${encodeURIComponent(key)}`,
    key,
  }));
  for (const url of publicNodes) candidates.push({ url });

  // A free dRPC plan answers three calls per batch and refuses a wider one, so a
  // wide batch is split into threes and sent in parallel on the keyed lane.
  return rpcAnswer("drpc", candidates, raw, 3);
}

// ---------------------------------------------------------------- Stacks
const isStacksAddress = (value) => /^S[PTMN][0-9A-Z]{20,60}$/.test(value || "");

export async function hiroBalances(query) {
  const address = String(query?.address || "");
  if (!isStacksAddress(address)) return fail(400, "Bad address.");

  const url = `https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`;
  const candidates = orderedKeys("HIRO_API_KEY").map((key) => ({ url, key, headers: { "x-api-key": key } }));
  // Hiro answers without a key as well, at a lower budget.
  candidates.push({ url });

  return firstOf(candidates, { method: "GET" });
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

  // Koios answers without any key, so Cardano never depends on one. A busy
  // indexer answers on a later try, so it is asked a few times before the
  // wallet is written off as a failed read.
  for (let attempt = 0; attempt < 3; attempt += 1) {
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
    if (answer && answer.status !== 429 && answer.status < 500) break;
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }

  const projects = keysOf("BLOCKFROST_PROJECT_ID");
  if (!projects.length) return { status: 200, text: JSON.stringify({ balances: {} }) };
  let projectPick = 0;

  const balances = {};
  let next = 0;
  const worker = async () => {
    while (next < addresses.length) {
      const address = addresses[next];
      next += 1;
      // Several projects share the reads, so one project's daily budget is not
      // spent by a single scan.
      const project = projects[projectPick % projects.length];
      projectPick += 1;
      const read = await once(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`, {
        headers: { project_id: project },
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

  // One free key allows five calls a second and a wallet costs several, so every
  // key in the list is used in turn and a key that refuses is rested instead of
  // ending this wallet's discovery.
  const keys = orderedKeys("ETHERSCAN_API_KEY");
  const blockscout = BLOCKSCOUT[chain];
  if (!keys.length && !blockscout) return { status: 200, text: JSON.stringify({ tokens: [] }) };

  const call = async (action, extra = "") => {
    const targets = keys.length
      ? keys.map((key) => ({
          url: `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=${action}&address=${address}${extra}&apikey=${encodeURIComponent(key)}`,
          key,
        }))
      : [{ url: `${blockscout}/api?module=account&action=${action}&address=${address}${extra}` }];
    for (const target of targets) {
      const read = await once(target.url, { headers: { accept: "application/json", "user-agent": UA } });
      if (!read) continue;
      if (read.status !== 200) {
        restKey(target.key, read.status);
        continue;
      }
      try {
        return JSON.parse(read.text);
      } catch {
        return null;
      }
    }
    return null;
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