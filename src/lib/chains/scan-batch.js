// Batched balance reads for the bulk scanner: one request covers many wallets on
// one EVM chain, so a batch of wallets costs a few round trips per chain instead
// of one request for every wallet on every chain.
import { chains } from "@/lib/chains/config";
import { request, resetLanes } from "@/lib/chains/scan-lanes";
import { EVM_MIRRORS } from "@/lib/chains/scan-mirrors";

// Public nodes refuse very large JSON-RPC batches, so calls are grouped. A
// larger group means far fewer round trips per round of wallets; a node that
// caps the size answers 400 and its group is split for the rest of the run.
const CALLS_PER_REQUEST = 200;
// Nodes differ: most accept 90 calls in one request, but some (zkEVM's node, for
// one) refuse anything over a handful. The smallest size a node accepts is
// remembered per chain, so a refused batch is split once and every later
// request already fits — instead of that chain failing for the whole scan.
const sizeCaps = new Map();
// The largest batch each node accepted, remembered per endpoint: a node that
// caps the size is skipped for a wide batch instead of being asked again.
const endpointCaps = new Map();
// A node that just refused is passed over for a moment: waiting on it again only
// costs a retry, so the batch goes straight to the next node that serves the chain.
const coolUntil = new Map();
const COOLDOWN_MS = 20000;
// A chain whose nodes never answer at all is rested for a while: without this,
// every round waits out its timeouts and holds back the wallets that are fine.
const downStrikes = new Map();
const chainRests = new Map();
const REST_MS = 60000;

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
  // A node that already refused a batch this wide is skipped straight away, so
  // the batch goes to the next node instead of costing another round trip here.
  const known = endpointCaps.get(endpoint);
  if (known && calls.length > known) {
    const error = new Error(`${chainId} batch too wide for this node`);
    error.batchRefused = true;
    throw error;
  }
  // Still cooling down from a refusal: this node is skipped without a request.
  if ((coolUntil.get(endpoint) || 0) > Date.now()) {
    const error = new Error(`${chainId} node busy (429).`);
    error.status = 429;
    throw error;
  }
  // The request waits in this node's own lane; the batch is handed to the next
  // node rather than retried here, because the load already moved on.
  const response = await request(
    endpoint,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(calls),
    },
    { attempts: 2 },
  );
  if (!response.ok) {
    const error = new Error(`${chainId} ${response.status}`);
    error.status = response.status;
    if (response.status === 429) coolUntil.set(endpoint, Date.now() + COOLDOWN_MS);
    // Only a size complaint means the batch itself was too big. A 429 is a busy
    // node, and splitting the batch for it used to shrink every later batch to a
    // single call, which made the whole chain read as failed.
    error.batchRefused = [400, 413, 414].includes(response.status) && calls.length > 1;
    if (error.batchRefused) endpointCaps.set(endpoint, Math.max(1, Math.floor(calls.length / 2)));
    throw error;
  }
  const body = await response.json().catch(() => null);
  if (!Array.isArray(body)) {
    const error = new Error(`${chainId} rejected the batch`);
    // A node under load sometimes answers 200 with one error object instead.
    if (/rate|limit|busy|capacity|exceed|too many/i.test(JSON.stringify(body || {}))) error.status = 429;
    else error.batchRefused = calls.length > 1;
    throw error;
  }
  return body;
}

/**
 * Sends one batch over the nodes that serve this chain. The mirrors come first:
 * the plain public node answers only a couple of wide batches before refusing,
 * so it is the fallback rather than the workhorse.
 */
async function postCalls(chainId, calls) {
  if ((chainRests.get(chainId) || 0) > Date.now()) {
    throw new Error(`${chainId} nodes are not answering`);
  }

  const chain = chains[chainId];
  const endpoints = [...(EVM_MIRRORS[chainId] || []), chain.rpc, ...(chain.rpcs || [])].filter(Boolean);

  let lastError = null;
  let busy = false;
  for (const endpoint of endpoints) {
    try {
      const body = await postTo(chainId, endpoint, calls);
      downStrikes.delete(chainId);
      return body;
    } catch (error) {
      lastError = error;
      // A busy node is not a broken chain: only a node that does not answer at
      // all counts towards resting the chain.
      if (error?.status === 429) busy = true;
    }
  }

  if (!busy) {
    const strikes = (downStrikes.get(chainId) || 0) + 1;
    downStrikes.set(chainId, strikes);
    if (strikes >= 3) {
      chainRests.set(chainId, Date.now() + REST_MS);
      downStrikes.delete(chainId);
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

  // Nothing at all came back: the node refused the batch under load, it did not
  // judge it. Reported as a busy node so the batch is asked again, instead of
  // every wallet in it being marked as a failed read.
  if (values.size === 0 && calls.length > 1) {
    const error = new Error(`${chainId} busy`);
    error.status = 429;
    throw error;
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

/** Every fresh scan starts with full batches and every node trusted again. */
export function resetBatching() {
  sizeCaps.clear();
  endpointCaps.clear();
  coolUntil.clear();
  downStrikes.clear();
  chainRests.clear();
  resetLanes();
}