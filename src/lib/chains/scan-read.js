// Balance readers for the extra networks the bulk scanner covers.
import { chains } from "@/lib/chains/config";
import { readCardanoBalances } from "@/lib/chains/cardano-read";
import { accountStorageKey, POLKADOT_ENDPOINTS, publicKeyFromAddress } from "@/lib/chains/polkadot";
import { verifyTonBalance } from "@/lib/chains/scan-verify";

const hexOf = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const bytesOf = (hex) =>
  Uint8Array.from((hex.replace(/^0x/, "").match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16)));

// BlockCypher blocks a whole IP with 403 once its free allowance is used, which
// left Dogecoin and Dash unreadable in a burst. Each of the two now has its own
// explorer reader, checked from a browser origin (it answers and sends a CORS
// header), and BlockCypher is kept only as the fallback.
async function dashBalance(address) {
  const response = await fetch(`https://chainz.cryptoid.info/dash/api.dws?q=getbalance&a=${address}`);
  if (!response.ok) throw new Error(`Dash explorer error (${response.status}).`);
  return Number(await response.text()) || 0;
}

async function dogecoinBalance(address) {
  const response = await fetch(`https://sochain.com/api/v3/balance/DOGE/${address}`);
  if (!response.ok) throw new Error(`Dogecoin network error (${response.status}).`);
  const data = await response.json();
  const confirmed = data?.data?.confirmed;
  if (confirmed === undefined) throw new Error("Dogecoin network error.");
  return Number(confirmed) || 0;
}

const DEDICATED_READERS = { dash: dashBalance, dogecoin: dogecoinBalance };

export async function blockcypherBalance(chainId, address) {
  const reader = DEDICATED_READERS[chainId];
  if (reader) {
    try {
      return await reader(address);
    } catch {
      // The explorer did not answer: BlockCypher still gets the last word.
    }
  }
  const chain = chains[chainId];
  const response = await fetch(`${chain.api}/addrs/${address}/balance`);
  if (!response.ok) throw new Error(`${chain.name} network error (${response.status}).`);
  const data = await response.json();
  return (data.final_balance || 0) / 1e8;
}

/** ADA balance across the phrase's Shelley base addresses, read through the backend. */
export async function cardanoBalance(addresses) {
  const list = (Array.isArray(addresses) ? addresses : [addresses]).filter(Boolean);
  if (!list.length) return 0;

  const balances = await readCardanoBalances(list);
  let lovelace = 0;
  for (const address of list) lovelace += Number(((balances.get(address) || 0) * 1e6).toFixed(6));
  return lovelace / 1e6;
}

/** APT balance in octas via the coin module's balance view (Aptos fullnode REST API). */
export async function aptosBalance(address) {
  const response = await fetch(`${chains.aptos.api}/view`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      function: "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [address],
    }),
  });
  // An address that has never been funded has no balance to report.
  if (response.status === 400 || response.status === 404) return 0;
  if (!response.ok) throw new Error(`Aptos network error (${response.status}).`);

  const [octas] = await response.json();
  return Number(octas || 0) / 1e8;
}

/** NEAR balance for this implicit account, in NEAR (1e24 yoctoNEAR per NEAR). */
export async function nearBalance(address) {
  // The mainnet node takes seconds per answer; FastNEAR answers the same query
  // in tens of milliseconds, so it is asked first and the node is the fallback.
  const endpoints = ["https://free.rpc.fastnear.com", chains.near.rpc, "https://near.drpc.org"];
  let lastStatus = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "query",
          params: { request_type: "view_account", finality: "final", account_id: address },
        }),
      });
      if (!response.ok) {
        lastStatus = response.status;
        continue;
      }

      const data = await response.json();
      const amount = data?.result?.amount;
      if (amount !== undefined) return Number(amount) / 1e24;
      // The account does not exist on chain yet, so it holds nothing.
      const message = `${data?.error?.cause?.name || ""} ${data?.error?.data || ""}`.toLowerCase();
      if (message.includes("unknown_account") || message.includes("does not exist")) return 0;
    } catch {
      // Try the next endpoint.
    }
  }

  throw new Error(lastStatus ? `NEAR network error (${lastStatus}).` : "NEAR network error.");
}

/** TON balance for a v4R2 wallet address, confirmed on a second indexer. */
export async function tonBalance(address) {
  if (!address) return 0;

  // Toncenter answers first. A funded answer is taken as it is; an empty one is
  // only trusted once TonAPI agrees, because a busy or lagging indexer answers
  // zero for a wallet that does hold TON — and that would hide a funded wallet.
  let fromToncenter;
  try {
    const response = await fetch(`${chains.ton.api}/getAddressBalance?address=${encodeURIComponent(address)}`);
    if (response.ok) {
      const data = await response.json();
      if (data?.ok) fromToncenter = Number(data.result || 0) / 1e9;
    }
  } catch {
    // Left unanswered: TonAPI below is the whole answer.
  }

  if (fromToncenter > 0) return fromToncenter;

  const fromTonapi = await verifyTonBalance(address).catch(() => undefined);
  if (fromTonapi === undefined && fromToncenter === undefined) throw new Error("TON network error.");
  return Math.max(fromToncenter || 0, fromTonapi || 0);
}

/** SUI balance in MIST, read through the Sui GraphQL endpoint. */
export async function suiBalance(address) {
  if (!address) return 0;
  const response = await fetch(chains.sui.api, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: "query($owner: SuiAddress!) { address(address: $owner) { balance(coinType: \"0x2::sui::SUI\") { totalBalance } } }",
      variables: { owner: address },
    }),
  });
  if (!response.ok) throw new Error(`Sui network error (${response.status}).`);

  const data = await response.json();
  const total = data?.data?.address?.balance?.totalBalance;
  if (total === undefined) throw new Error("Sui network error.");
  return Number(total) / 1e9;
}

const DOT_ENDPOINTS = POLKADOT_ENDPOINTS;
const XRP_ENDPOINTS = [chains.xrp.api, "https://xrpl.ws"];

/** DOT balance from this account's System.Account entry on the Polkadot relay chain. */
export async function polkadotBalance(address) {
  if (!address) return 0;
  const key = `0x${hexOf(accountStorageKey(publicKeyFromAddress(address)))}`;
  let lastError = null;

  for (const endpoint of DOT_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "state_getStorage", params: [key] }),
      });
      if (!response.ok) {
        lastError = new Error(`Polkadot network error (${response.status}).`);
        continue;
      }
      const data = await response.json();
      if (data?.error) {
        lastError = new Error("Polkadot network error.");
        continue;
      }
      // No storage entry means the account has never been funded.
      if (!data?.result) return 0;
      const account = bytesOf(data.result);
      // AccountInfo: nonce, consumers, providers, sufficients (4 × u32), then free (u128).
      if (account.length < 32) return 0;
      let planck = 0n;
      for (let i = 31; i >= 16; i -= 1) planck = (planck << 8n) | BigInt(account[i]);
      return Number(planck) / 1e10;
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error("Polkadot network error.");
    }
  }

  throw lastError || new Error("Polkadot network error.");
}

export async function xrpBalance(address, base) {
  let lastError = null;
  // The scan hands in the mirror it wants first; the rest stay as fallbacks.
  const endpoints = base ? [base, ...XRP_ENDPOINTS.filter((item) => item !== base)] : XRP_ENDPOINTS;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method: "account_info", params: [{ account: address, ledger_index: "validated" }] }),
      });
      if (!response.ok) {
        lastError = new Error(`XRP Ledger network error (${response.status}).`);
        continue;
      }
      const data = await response.json();
      const drops = data?.result?.account_data?.Balance;
      if (drops !== undefined) return Number(drops) / 1e6;
      if (data?.result?.error === "actNotFound") return 0;
      lastError = new Error("XRP Ledger network error.");
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error("XRP Ledger network error.");
    }
  }

  throw lastError || new Error("XRP Ledger network error.");
}