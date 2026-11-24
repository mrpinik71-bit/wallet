import { countPhrasesInFile, phrasesFromFile } from "@/lib/phrase-scan";
async function main() {
  const p12 = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const p24 = `${Array(23).fill("abandon").join(" ")} art`;
  const lines = [];
  for (let i = 0; i < 3; i += 1) { lines.push(`${i + 1}. ${p12}`); lines.push(`${i + 1}. ${p24}`); }
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const out = {};
  for (const size of [12, 15, 18, 21, 24]) {
    const counted = await countPhrasesInFile(blob, { words: size });
    let yielded = 0;
    for await (const e of phrasesFromFile(blob, { words: size, onlyValid: true })) { if (e.words !== size) throw new Error(`wrong length ${e.words} for ${size}`); yielded += 1; }
    out[size] = { counted: counted.count, invalid: counted.invalid, yielded };
  }
  console.log(JSON.stringify(out));
}
main();
