// Balance readers for the extra networks the bulk scanner covers.
import { chains } from "@/lib/chains/config";
import { accountStorageKey, publicKeyFromAddress } from "@/lib/chains/polkadot";

const hexOf = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const bytesOf = (hex) =>
  Uint8Array.from((hex.replace(/^0x/, "").match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16)));

export async function blockcypherBalance(chainId, address) {
  const chain = chains[chainId];
  const response = await fetch(`${chain.api}/addrs/${address}/balance`);
  if (!response.ok) throw new Error(`${chain.name} network error (${response.status}).`);
  const data = await response.json();
  return (data.final_balance || 0) / 1e8;
}

/** ADA balance across the phrase's Shelley base addresses (Koios). */
export async function cardanoBalance(addresses) {
  const list = (Array.isArray(addresses) ? addresses : [addresses]).filter(Boolean);
  if (!list.length) return 0;

  const response = await fetch(`${chains.cardano.api}/address_info`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ _addresses: list }),
  });
  if (!response.ok) throw new Error(`Cardano network error (${response.status}).`);

  const rows = await response.json();
  const lovelace = (Array.isArray(rows) ? rows : []).reduce((sum, row) => sum + Number(row.balance || 0), 0);
  return lovelace / 1e6;
}

const DOT_ENDPOINTS = [chains.polkadot.rpc, "https://rpc.polkadot.io"];
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

export async function xrpBalance(address) {
  let lastError = null;

  for (const endpoint of XRP_ENDPOINTS) {
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