// Diagnostic: timed scan of N fresh 12-word phrases against the real network,
// with this app's relay routes served locally (the keys stay in this process).
import { generateMnemonic } from "@/lib/bip39";
import { scanPhrases } from "@/lib/chains/scan-pipeline";
import { fetchPrices } from "@/lib/chains/prices";

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
    return realFetch(`https://api.hiro.so/extended/v1/address/${address}/balances`, {
      headers: { "x-api-key": HIRO_KEY },
    });
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
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row?.address) balances[row.address] = String(row.balance ?? "0");
    }
    return Response.json({ balances });
  }

  return realFetch(input, init);
};

async function main() {
  const N = Number(process.env.N || 200);
  const started = Date.now();
  let firstResultMs = null;

  const entries = [];
  for (let i = 0; i < N; i += 1) entries.push({ phrase: await generateMnemonic(12), words: 12, line: i + 1 });

  async function* source() {
    for (const entry of entries) yield entry;
  }

  const prices = await fetchPrices().catch(() => ({}));
  let done = 0;
  let funded = 0;
  const failedCounts = {};
  let lastLog = -25;

  await scanPhrases(source(), {
    prices,
    onResult: (result) => {
      done += 1;
      if (firstResultMs === null) firstResultMs = Date.now() - started;
      if ((result.funded || []).length) funded += 1;
      for (const symbol of result.failedChains || []) failedCounts[symbol] = (failedCounts[symbol] || 0) + 1;
      if (done - lastLog >= 25 || done === N) {
        lastLog = done;
        const secs = (Date.now() - started) / 1000;
        console.log(`progress ${done}/${N} at ${secs.toFixed(1)}s — ${(done / secs * 60).toFixed(1)} wallets/min`);
      }
    },
  });

  const seconds = (Date.now() - started) / 1000;
  const sorted = Object.entries(failedCounts).sort((a, b) => b[1] - a[1]);
  console.log(
    JSON.stringify(
      {
        wallets: done,
        seconds: Number(seconds.toFixed(1)),
        walletsPerMinute: Number((done / seconds * 60).toFixed(1)),
        msPerWallet: Math.round((seconds * 1000) / done),
        firstResultSeconds: firstResultMs === null ? null : Number((firstResultMs / 1000).toFixed(1)),
        fundedWallets: funded,
        failedChainCounts: Object.fromEntries(sorted.slice(0, 15)),
      },
      null,
      1,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});