import { getAddresses } from "@/lib/chains/derive";
import { SCAN_ASSETS } from "@/lib/chains/scan-catalog";
import { readBalance } from "@/lib/chains/portfolio";

async function main() {
  const phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const holder = "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7";
  const addrs = getAddresses(phrase, 0);
  const usdtTron = SCAN_ASSETS.find((a) => a.id === "usdt-tron");
  const trx = SCAN_ASSETS.find((a) => a.id === "trx");
  const out = {
    derivedKeys: Object.keys(addrs),
    tronAddress: addrs.tron || null,
    usdtTronAsset: usdtTron ? { family: usdtTron.family, chain: usdtTron.chain, decimals: usdtTron.decimals, address: usdtTron.address } : null,
    trxAsset: trx ? { family: trx.family, chain: trx.chain, kind: trx.kind } : null,
  };
  try { out.usdtRead = await readBalance(usdtTron, holder); } catch (e) { out.usdtReadError = String(e.message); }
  try { out.trxRead = await readBalance(trx, holder); } catch (e) { out.trxReadError = String(e.message); }
  console.log(JSON.stringify(out, null, 1));
}
main();
