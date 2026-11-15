import { generateMnemonic } from "@/lib/bip39";
import { prepare } from "@/lib/chains/scan-derive";
(async () => {
  const phrase = await generateMnemonic(12);
  const w = prepare({ phrase, words: 12, line: 1 });
  console.log(JSON.stringify({ dash: w.addresses.dash, btc: w.addresses.bitcoin, stx: w.addresses.stacks }));
})();
