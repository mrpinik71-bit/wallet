import { phrasesFromLines } from "@/lib/phrase-lines";
const valid = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
async function* oneLine(n) { yield Array.from({ length: n }, () => valid).join(" "); }
for (const n of [500, 1000, 2000]) {
  const t0 = Date.now();
  let c = 0;
  for await (const e of phrasesFromLines(oneLine(n), 12)) c += 1;
  console.log(JSON.stringify({ phrasesOnOneLine: n, parsed: c, ms: Date.now() - t0 }));
}
