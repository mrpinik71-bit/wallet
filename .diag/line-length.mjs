import { countPhrasesInFile } from "@/lib/phrase-scan";
async function main() {
  const p12 = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const p24 = `${Array(23).fill("abandon").join(" ")} art`;
  const lines = [
    `1. ${p12}`,
    `Phrase 2: ${p12} — main wallet`,
    p24,
    "abandon abandon abandon",
    "",
    p12,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const out = {};
  for (const size of [12, 15, 24]) {
    const r = await countPhrasesInFile(blob, { words: size, preview: 10 });
    out[size] = { valid: r.count, unreadable: r.invalid, entries: r.preview.length, head: r.preview.map((p) => [p.line, p.unreadable]) };
  }
  console.log(JSON.stringify(out));
}
main();
