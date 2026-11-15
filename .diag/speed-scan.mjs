// Diagnostic: one small scan round, timed, with the app's relays served locally.
// Exported as run() so it can be driven from the executor.
import { generateMnemonic } from "@/lib/bip39";
import { scanPhrases } from "@/lib/chains/scan-pipeline";

function installRelays() {
  const realFetch = globalThis.fetch;
  const DRPC_KEY = process.env.DRPC_API_KEY;
  const HIRO_KEY = process.env.HIRO_API_KEY;

  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;

    if (url.startsWith("/api/rpc-drpc")) {
      const network = new URL(url, "http://local").searchParams.get("network") || "";
      return realFetch(`https://lb.drpc.live/${encodeURIComponent(network)}/${encodeURIComponent(DRPC_KEY)}`, init);
    }
    if (url.startsWith("/api/rpc-hiro")) {
      const address = new URL(url, "http://local").searchParams.get("address") || "";
      return realFetch(`https://api.hiro.so/extended/v1/address/${address}/balances`, { headers: { "x-api-key": HIRO_KEY } });
    }
    if (url.startsWith("/api/cardano-balances")) {
      const addresses = JSON.parse(init.body || "{}").addresses || [];
      const response = await realFetch("https://api.koios.rest/api/v1/address_info", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ _addresses: addresses }),
      });
      const rows = await response.json().catch(() => []);
      const balances = {};
      for (const row of Array.isArray(rows) ? rows : []) if (row?.address) balances[row.address] = String(row.balance ?? "0");
      return Response.json({ balances });
    }
    return realFetch(input, init);
  };
}

async function run(n = 10, deadlineSeconds = 0) {
  installRelays();
  const entries = [];
  for (let i = 0; i < n; i += 1) entries.push({ phrase: await generateMnemonic(12), words: 12, line: i + 1 });

  async function* source() {
    for (const entry of entries) yield entry;
  }

  const started = Date.now();
  const lands = [];
  const failed = {};
  await scanPhrases(source(), {
    prices: {},
    onResult: (result) => {
      lands.push(Number(((Date.now() - started) / 1000).toFixed(1)));
      for (const symbol of result.failedChains || []) failed[symbol] = (failed[symbol] || 0) + 1;
    },
  });

  const seconds = (Date.now() - started) / 1000;
  return {
    wallets: n,
    seconds: Number(seconds.toFixed(1)),
    walletsPerMinute: Number(((n / seconds) * 60).toFixed(1)),
    completionTimes: lands,
    failedChains: Object.entries(failed).sort((a, b) => b[1] - a[1]).slice(0, 12),
  };
}

module.exports = { run };