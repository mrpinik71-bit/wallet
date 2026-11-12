// Balance readers for the extra networks the bulk scanner covers.
import { chains } from "@/lib/chains/config";

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

const XRP_ENDPOINTS = [chains.xrp.api, "https://xrpl.ws"];

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