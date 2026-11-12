// Batched balance reads for the bulk scanner: one request covers many wallets on
// one EVM chain, so a batch of wallets costs a few round trips per chain instead
// of one request for every wallet on every chain.
import { chains } from "@/lib/chains/config";

// Public nodes refuse very large JSON-RPC batches, so calls are grouped.
const CALLS_PER_REQUEST = 90;

const balanceOfData = (address) =>
  `0x70a08231${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;

/** Reads the native balance and every token balance for a small group of wallets. */
async function readGroup(chainId, addresses, coins) {
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

  const response = await fetch(chains[chainId].rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(calls),
  });
  if (!response.ok) throw new Error(`${chainId} ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body)) throw new Error(`${chainId} rejected the batch`);

  const raw = new Map();
  for (const item of body) {
    if (item && item.result !== undefined && item.result !== null) raw.set(item.id, item.result);
  }

  // Returns wallet position → (asset id → balance). An asset missing from the map
  // could not be read, and is reported as a failed read rather than zero funds.
  const balances = new Map();
  for (const slot of slots) {
    if (!raw.has(slot.id)) continue;
    const entry = balances.get(slot.index) || new Map();
    entry.set(slot.coinId, Number(BigInt(raw.get(slot.id))) / 10 ** slot.decimals);
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