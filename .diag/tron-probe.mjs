import { trc20Balance, tronBalance } from "@/lib/chains/tron";
const HOLDER = "TKHuVq1oKVruCGLvqVexFs6dawKv6fQgFs";
const coin = { kind: "token", chain: "tron", address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6 };
async function main() {
  const out = {};
  try { out.usdt = await trc20Balance(HOLDER, coin); } catch (e) { out.usdtError = String(e?.message).slice(0, 120); }
  try { out.trx = await tronBalance(HOLDER); } catch (e) { out.trxError = String(e?.message).slice(0, 120); }
  console.log(JSON.stringify(out));
}
main();
