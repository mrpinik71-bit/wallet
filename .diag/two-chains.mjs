import { assets } from "@/lib/chains/config";
import { readBalance } from "@/lib/chains/portfolio";
const ADD = { tron: "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH", ton: "UQBHyu-oZVDHRYQ1-rKlGqpHy5yAqanPBirEQNMNOmfHLtaT" };
async function main() {
  const out = {};
  for (const chain of ["tron", "ton"]) {
    out[chain] = {};
    for (const coin of assets.filter((a) => a.chain === chain)) {
      try { out[chain][coin.id] = await readBalance(coin, ADD[chain]); }
      catch (e) { out[chain][coin.id] = "ERR " + String(e?.message).slice(0, 70); }
    }
  }
  console.log(JSON.stringify(out, null, 1));
}
main();
