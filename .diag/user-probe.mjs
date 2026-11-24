import { trc20Balance, tronBalance } from "@/lib/chains/tron";
import { tonBalance, tonJettonBalance } from "@/lib/chains/scan-read";

const TRON = "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH";
const TON = "UQBHyu-oZVDHRYQ1-rKlGqpHy5yAqanPBirEQNMNOmfHLtaT";
const USDT_TRON = { kind: "token", chain: "tron", address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6 };
const USDT_TON = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";

async function main() {
  const out = {};
  try { out.tronTrx = await tronBalance(TRON); } catch (e) { out.tronTrxError = String(e?.message).slice(0, 140); }
  try { out.tronUsdt = await trc20Balance(TRON, USDT_TRON); } catch (e) { out.tronUsdtError = String(e?.message).slice(0, 140); }
  try { out.tonNative = await tonBalance(TON); } catch (e) { out.tonNativeError = String(e?.message).slice(0, 140); }
  try { out.tonUsdt = await tonJettonBalance(TON, USDT_TON, 6); } catch (e) { out.tonUsdtError = String(e?.message).slice(0, 140); }
  console.log(JSON.stringify(out, null, 1));
}
main();
