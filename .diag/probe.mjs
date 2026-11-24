import { evmChainBalancesMany } from "@/lib/chains/scan-batch";
import { SCAN_ASSETS } from "@/lib/chains/scan-catalog";

const addrs = Array.from({ length: 100 }, (_, i) => "0x" + (i + 1).toString(16).padStart(40, "0"));
const byChain = new Map();
for (const a of SCAN_ASSETS.filter((x) => x.family === "evm")) {
  const l = byChain.get(a.chain) || []; l.push(a); byChain.set(a.chain, l);
}
async function run(chain, coins) {
  const got = await evmChainBalancesMany(chain, addrs, coins);
  let missing = 0;
  for (let i = 0; i < addrs.length; i += 1) {
    const e = got.get(i);
    missing += coins.length - (e?.size || 0);
  }
  return missing;
}
async function main() {
  const bad = [];
  for (const [chain, coins] of byChain) {
    const results = [];
    for (let k = 0; k < 2; k += 1) results.push(await run(chain, coins).catch((e) => "ERR " + e.message.slice(0, 30)));
    if (results.some((r) => r !== 0)) bad.push({ chain, results });
  }
  console.log(JSON.stringify(bad, null, 1));
}
main();
