// Batched balance reads for the bulk scanner: one request covers many wallets on
// one EVM chain, so a batch of wallets costs a few round trips per chain instead
// of one request for every wallet on every chain.
import { chains } from "@/lib/chains/config";

// Public nodes refuse very large JSON-RPC batches, so calls are grouped.
const CALLS_PER_REQUEST = 90;
// Nodes differ: most accept 90 calls in one request, but some (zkEVM's node, for
// one) refuse anything over a handful. The smallest size a node accepts is
// remembered per chain, so a refused batch is split once and every later
// request already fits — instead of that chain failing for the whole scan.
const sizeCaps = new Map();

const balanceOfData = (address) =>
  `0x70a08231${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;

/** Builds the calls for one group of wallets, plus which wallet/asset each answers. */
function buildCalls(addresses, coins) {
  const native = coins.find((coin) => coin.kind !== "token");
  const tokens = coins.filter((coin) => coin.kind === "token");

  const calls = [];
  const slots = [];

  addresses.forEach((address, index) => {
    if (native) {
      const id = calls.length + 1;
      slots.push({ id, index, coinId: native.id, decimals: native.decimals });
      calls.push({ jsonrpc: "2.0", id, method: "eth_getBalance", params: [address, "latest"] });
    }
    for (const coin of tokens) {
      const id = calls.length + 1;
      slots.push({ id, index, coinId: coin.id, decimals: coin.decimals });
      calls.push({
        jsonrpc: "2.0",
        id,
        method: "eth_call",
        params: [{ to: coin.address, data: balanceOfData(address) }, "latest"],
      });
    }
  });

  return { calls, slots };
}

async function postTo(chainId, endpoint, calls) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(calls),
  });
  if (!response.ok) {
    const error = new Error(`${chainId} ${response.status}`);
    // A node that caps batch size answers 400/413 (or 429 on a big body).
    error.batchRefused = [400, 413, 414, 429].includes(response.status) && calls.length > 1;
    throw error;
  }
  const body = await response.json().catch(() => null);
  if (!Array.isArray(body)) {
    const error = new Error(`${chainId} rejected the batch`);
    error.batchRefused = calls.length > 1;
    throw error;
  }
  return body;
}

/** Sends one batch, moving to the chain's backup endpoint when a node is busy. */
async function postCalls(chainId, calls) {
  const chain = chains[chainId];
  const endpoints = [chain.rpc, ...(chain.rpcs || [])].filter(Boolean);
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      return await postTo(chainId, endpoint, calls);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Sends calls, splitting a refused batch and asking failed items again once. */
async function readCalls(chainId, calls) {
  const cap = sizeCaps.get(chainId) || CALLS_PER_REQUEST;
  if (calls.length > cap) {
    const values = new Map();
    for (let start = 0; start < calls.length; start += cap) {
      const part = await readCalls(chainId, calls.slice(start, start + cap));
      for (const [id, value] of part) values.set(id, value);
    }
    return values;
  }

  let body;
  try {
    body = await postCalls(chainId, calls);
  } catch (error) {
    if (!error.batchRefused) throw error;
    const half = Math.ceil(calls.length / 2);
    sizeCaps.set(chainId, Math.max(1, Math.min(cap, half)));
    const values = new Map();
    for (const part of [calls.slice(0, half), calls.slice(half)]) {
      if (!part.length) continue;
      for (const [id, value] of await readCalls(chainId, part)) values.set(id, value);
    }
    return values;
  }

  const values = new Map();
  const missing = [];
  for (const item of body) {
    if (!item || item.id === undefined) continue;
    if (item.error || item.result === undefined || item.result === null) missing.push(item.id);
    else values.set(item.id, item.result);
  }

  // One call failing (a busy node, a single odd token) must not write off every
  // wallet in the batch: those calls are asked again on their own, once.
  if (missing.length && missing.length < calls.length) {
    const retries = calls.filter((call) => missing.includes(call.id));
    const again = await readCalls(chainId, retries).catch(() => new Map());
    for (const [id, value] of again) values.set(id, value);
  }

  return values;
}

/** Reads the native balance and every token balance for a small group of wallets. */
async function readGroup(chainId, addresses, coins) {
  const { calls, slots } = buildCalls(addresses, coins);
  if (!calls.length) return new Map();

  const raw = await readCalls(chainId, calls);

  // Returns wallet position → (asset id → balance). An asset missing from the map
  // could not be read, and is reported as a failed read rather than zero funds.
  const balances = new Map();
  for (const slot of slots) {
    if (!raw.has(slot.id)) continue;
    let amount;
    try {
      amount = Number(BigInt(raw.get(slot.id))) / 10 ** slot.decimals;
    } catch {
      // An unreadable result is left out, so it counts as a failed read.
      continue;
    }
    const entry = balances.get(slot.index) || new Map();
    entry.set(slot.coinId, amount);
    balances.set(slot.index, entry);
  }
  return balances;
}

/**
 * Reads every tracked asset on one EVM chain for many wallets at once.
 * Returns wallet position → (asset id → balance).
 */
export async function evmChainBalancesMany(chainId, addresses, coins) {
  const perAddress = Math.max(1, coins.length);
  const groupSize = Math.max(1, Math.floor(CALLS_PER_REQUEST / perAddress));

  const groups = [];
  for (let start = 0; start < addresses.length; start += groupSize) {
    groups.push({ start, list: addresses.slice(start, start + groupSize) });
  }

  const parts = await Promise.all(groups.map((group) => readGroup(chainId, group.list, coins)));

  const balances = new Map();
  parts.forEach((part, position) => {
    const offset = groups[position].start;
    for (const [index, entry] of part) balances.set(offset + index, entry);
  });
  return balances;
}