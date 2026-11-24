import { trc20Balance, tronBalance, isTronAddress } from "@/lib/chains/tron";
import { SCAN_ASSETS } from "@/lib/chains/scan-catalog";

const usdt = SCAN_ASSETS.find((asset) => asset.id === "usdt-tron");
const ADDRESS = "TAUN6FwrnwwmaEqYcckffC7wYmbaS6cBiX";

export default async function run() {
  const out = {
    coin: usdt ? { chain: usdt.chain, kind: usdt.kind, address: usdt.address, decimals: usdt.decimals } : null,
    validAddress: isTronAddress(ADDRESS),
  };
  try {
    out.trx = await tronBalance(ADDRESS);
  } catch (error) {
    out.trxError = error.message;
  }
  try {
    out.usdt = await trc20Balance(ADDRESS, usdt);
  } catch (error) {
    out.usdtError = error.message;
  }
  return out;
}