import { prepare } from "@/lib/chains/scan-derive";
import { SCAN_ASSETS } from "@/lib/chains/scan-catalog";
import { polkadotAssetBalancesMany, suiBalancesMany } from "@/lib/chains/scan-batch-multi";

async function main() {
  const wallet = prepare({
    phrase: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
    line: 1,
  });
  const out = [];
  const tokens = SCAN_ASSETS.filter((c) => c.kind === "token" && (c.chain === "sui" || c.chain === "polkadot"));
  for (const coin of tokens) {
    const address = wallet.addresses[coin.chain];
    const started = Date.now();
    try {
      const values =
        coin.chain === "sui"
          ? await suiBalancesMany([address], coin.address, coin.decimals)
          : await polkadotAssetBalancesMany([address], coin.address, coin.decimals);
      out.push({ chain: coin.chain, symbol: coin.symbol, asset: String(coin.address).slice(0, 40), ms: Date.now() - started, got: values.get(0) });
    } catch (error) {
      out.push({ chain: coin.chain, symbol: coin.symbol, asset: String(coin.address).slice(0, 40), ms: Date.now() - started, error: String(error?.message || error) });
    }
  }
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
}
main();