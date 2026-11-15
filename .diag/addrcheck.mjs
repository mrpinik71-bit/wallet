import { generateMnemonic } from "@/lib/bip39";
import { prepare } from "@/lib/chains/scan-derive";
(async () => {
  const phrase = await generateMnemonic(12);
  const w = prepare({ phrase, words: 12, line: 1 });
  const a = w.addresses.dash;
  const urls = [
    ["chainz", `https://chainz.cryptoid.info/dash/api.dws?q=getbalance&a=${a}`],
    ["insight-balance", `https://insight.dash.org/insight-api/addr/${a}/balance`],
    ["insight-raw", `https://insight.dash.org/insight-api/rawaddr/${a}`],
  ];
  for (const [name, url] of urls) {
    const started = Date.now();
    try {
      const response = await fetch(url);
      const text = (await response.text()).slice(0, 120);
      console.log(name, response.status, `${Date.now() - started}ms`, text.replace(/\s+/g, " "));
    } catch (error) {
      console.log(name, "ERR", String(error.message).slice(0, 90));
    }
  }
})();
