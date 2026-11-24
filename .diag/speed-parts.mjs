// Diagnostic: splits scan time into derivation and network, so the browser rate
// can be estimated (the browser spreads derivation over every core; Node here
// runs it on one thread).
import { generateMnemonic } from "@/lib/bip39";
import { prepare } from "@/lib/chains/scan-derive";
import { scanPhrases } from "@/lib/chains/scan-pipeline";

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

async function makeEntries(n) {
  const entries = [];
  for (let i = 0; i < n; i += 1) entries.push({ phrase: await generateMnemonic(12), words: 12, line: i + 1 });
  return entries;
}

async function timedScan(entries) {
  async function* source() {
    for (const entry of entries) yield entry;
  }
  const started = Date.now();
  let done = 0;
  const failed = {};
  await scanPhrases(source(), {
    prices: {},
    onResult: (result) => {
      done += 1;
      for (const symbol of result.failedChains || []) failed[symbol] = (failed[symbol] || 0) + 1;
    },
  });
  const seconds = (Date.now() - started) / 1000;
  const top = Object.entries(failed).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return { wallets: done, seconds: Number(seconds.toFixed(1)), failedChains: Object.fromEntries(top) };
}

async function main() {
  // 1) derivation alone, single thread
  const sample = await makeEntries(10);
  const t0 = Date.now();
  for (const entry of sample) prepare(entry);
  const deriveSeconds10 = (Date.now() - t0) / 1000;

  // 2) full scan of the same 10 wallets (derivation + every chain read)
  const scan10 = await timedScan(sample);

  // 3) a wider round, to see how the per-wallet network cost scales
  const bigger = await makeEntries(30);
  const scan30 = await timedScan(bigger);

  console.log(
    JSON.stringify(
      {
        deriveMsPerWallet: Math.round((deriveSeconds10 * 1000) / 10),
        scan10,
        networkSecondsFor10: Number((scan10.seconds - deriveSeconds10).toFixed(1)),
        scan30,
        deriveSeconds30Estimated: Number(((deriveSeconds10 / 10) * 30).toFixed(1)),
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