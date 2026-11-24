import { scanPhrases } from "@/lib/chains/scan-pipeline";
import { fetchPrices } from "@/lib/chains/prices";

const PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

export default async function run() {
  const seen = { account: 0, call: 0, hosts: new Set(), statuses: [] };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const text = String(url?.url || url);
    if (text.includes("/wallet/getaccount")) seen.account += 1;
    if (text.includes("/wallet/triggerconstantcontract")) seen.call += 1;
    if (text.includes("trongrid") || text.includes("publicnode") || text.includes("tronstack")) {
      try {
        seen.hosts.add(new URL(text).host);
      } catch {
        seen.hosts.add("relative");
      }
    }
    const response = await realFetch(url, options);
    if (text.includes("/wallet/")) seen.statuses.push(`${response.status}`);
    return response;
  };

  const prices = await fetchPrices().catch(() => null);
  const results = [];
  await scanPhrases([{ phrase: PHRASE, line: 1 }], {
    prices,
    accounts: 1,
    onResult: (result) => results.push(result),
  });
  globalThis.fetch = realFetch;
  return {
    tronCalls: seen.call,
    tronAccountCalls: seen.account,
    tronHosts: [...seen.hosts],
    tronStatuses: seen.statuses,
    failedChains: results[0]?.failedChains,
  };
}