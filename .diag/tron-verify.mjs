import { trc20Balance, tronBalance } from "@/lib/chains/tron";
import { SCAN_ASSETS } from "@/lib/chains/scan-catalog";

async function main() {
  const usdt = SCAN_ASSETS.find((a) => a.id === "usdt-tron");
  const holder = "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7";
  const empty = "TGLskWNr9eezzYcqU9yrgZ8a9Sd7dU1nvx";
  const out = {};
  const t = async (label, fn) => {
    const started = Date.now();
    try { out[label] = { value: await fn(), ms: Date.now() - started }; }
    catch (e) { out[label] = { error: String(e.message), ms: Date.now() - started }; }
  };
  await t("usdt_holder", () => trc20Balance(holder, usdt));
  await t("usdt_empty", () => trc20Balance(empty, usdt));
  await t("trx_holder", () => tronBalance(holder));
  await t("trx_empty", () => tronBalance(empty));
  console.log(JSON.stringify(out, null, 1));
}
main();
