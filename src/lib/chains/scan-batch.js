// Batched balance reads for the bulk scanner. Every EVM chain is asked once per
// wallet: the native balance and each tracked token travel in a single JSON-RPC
// batch, so one HTTP round trip replaces a dozen.
import { chains } from "@/lib/chains/config";

const balanceOfData = (address) => `0x70a08231${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;

/**
 * Reads the native balance and every token balance on one EVM chain in a single
 * request. Returns a map of asset id → balance; an asset missing from the map
 * could not be read (and is reported as a failed read, never as zero funds).
 */
export async function evmChainBalances(chainId, address, coins) {
  const native = coins.find((coin) => coin.kind !== "token");
  const tokens = coins.filter((coin) => coin.kind === "token");

  const calls = [];
  if (native) calls.push({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] });
  tokens.forEach((coin, index) => {
    calls.push({
      jsonrpc: "2.0",
      id: index + 2,
      method: "eth_call",
      params: [{ to: coin.address, data: balanceOfData(address) }, "latest"],
    });
  });

  const response = await fetch(chains[chainId].rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(calls),
  });
  if (!response.ok) throw new Error(`${chainId} ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body)) throw new Error(`${chainId} rejected the batch`);

  const results = new Map();
  for (const item of body) {
    if (item && item.result !== undefined && item.result !== null) results.set(item.id, item.result);
  }

  const balances = new Map();
  if (native && results.has(1)) {
    balances.set(native.id, Number(BigInt(results.get(1))) / 1e18);
  }
  tokens.forEach((coin, index) => {
    const raw = results.get(index + 2);
    if (raw === undefined) return;
    balances.set(coin.id, Number(BigInt(raw)) / 10 ** coin.decimals);
  });
  return balances;
}