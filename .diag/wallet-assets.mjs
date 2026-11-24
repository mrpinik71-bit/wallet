import { assets } from "@/lib/chains/config";
import { readBalance } from "@/lib/chains/portfolio";
const TRON = "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH";
async function main() {
  const coin = assets.find((a) => a.id === "usdt-tron");
  const trx = assets.find((a) => a.id === "tron");
  console.log(JSON.stringify({
    listed: assets.filter((a) => a.symbol === "USDT").map((a) => a.id),
    usdt: coin ? await readBalance(coin, TRON) : "missing",
    trx: trx ? await readBalance(trx, TRON) : "missing",
  }));
}
main();
