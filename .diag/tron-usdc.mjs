import { trc20Balance } from "@/lib/chains/tron";
const HOLDER = "TKHuVq1oKVruCGLvqVexFs6dawKv6fQgFs";
async function main() {
  const out = {};
  for (const [sym, addr] of [["USDT", "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"], ["USDC", "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8"]]) {
    try { out[sym] = await trc20Balance(HOLDER, { address: addr, decimals: 6 }); } catch (e) { out[sym] = "ERR " + String(e?.message).slice(0, 80); }
  }
  console.log(JSON.stringify(out));
}
main();
