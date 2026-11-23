// Second opinion for TON and Solana.
//
// Both chains are read in bulk from a single node, and a single node can be
// wrong: one that is rate-limited, lagging or behind a proxy answers an empty
// wallet for a wallet that does hold funds. So every wallet these two chains
// report as empty — or could not answer at all — is asked one independent
// source more, and the higher of the two answers is the one the scan keeps.
import { request } from "@/lib/chains/scan-lanes";

// Independent of the node the batch read used.
const SOLANA_VERIFY_NODES = ["https://solana-rpc.publicnode.com", "https://api.mainnet-beta.solana.com"];
const SOLANA_GROUP = 50;

const TON_INDEXER = "https://tonapi.io/v2";

const jsonOf = async (response) => {
  if (!response.ok) throw new Error(`Node answered ${response.status}.`);
  return response.json();
};

const solanaRpc = (node, method, params) =>
  request(
    node,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    },
    { timeout: 12000 },
  ).then(jsonOf);

/** SOL balances for a batch of wallets, read from a node the scan has not used. */
export async function verifySolanaBalances(addresses) {
  const confirmed = new Map();
  const list = [...new Set((addresses || []).filter(Boolean))];

  for (let start = 0; start < list.length; start += SOLANA_GROUP) {
    const slice = list.slice(start, start + SOLANA_GROUP);
    for (const node of SOLANA_VERIFY_NODES) {
      try {
        const data = await solanaRpc(node, "getMultipleAccounts", [slice, { encoding: "base64" }]);
        const values = data?.result?.value;
        if (!Array.isArray(values)) throw new Error("Solana node did not answer the batch.");
        values.forEach((value, offset) => {
          if (offset >= slice.length) return;
          confirmed.set(slice[offset], (value?.lamports || 0) / 1e9);
        });
        break; // this node answered the whole group, so it is the second opinion
      } catch {
        // Try the next independent node.
      }
    }
  }

  return confirmed;
}

/** TON balance of one wallet from TonAPI, independent of Toncenter. */
export async function verifyTonBalance(address) {
  const response = await request(`${TON_INDEXER}/accounts/${encodeURIComponent(address)}`, {}, { timeout: 12000 });
  const data = await jsonOf(response);
  // An address that has never been funded simply reports no balance.
  return Number(data?.balance || 0) / 1e9;
}