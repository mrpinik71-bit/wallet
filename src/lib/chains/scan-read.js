// Balance readers for the extra networks the bulk scanner covers.
import { chains } from "@/lib/chains/config";

export async function blockcypherBalance(chainId, address) {
  const chain = chains[chainId];
  const response = await fetch(`${chain.api}/addrs/${address}/balance`);
  if (!response.ok) throw new Error(`${chain.name} network error (${response.status}).`);
  const data = await response.json();
  return (data.final_balance || 0) / 1e8;
}

export async function xrpBalance(address) {
  const response = await fetch(chains.xrp.api, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method: "account_info", params: [{ account: address, ledger_index: "validated" }] }),
  });
  const data = await response.json();
  const drops = data?.result?.account_data?.Balance;
  if (drops === undefined) {
    if (data?.result?.error === "actNotFound") return 0;
    throw new Error("XRP Ledger network error.");
  }
  return Number(drops) / 1e6;
}