import { countPhrasesInFile } from "@/lib/phrase-scan";
async function main() {
  const valid = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const rows = [];
  for (let i = 0; i < 200000; i += 1) rows.push(`${i + 1}. ${valid}`);
  const blob = new Blob([rows.join("\n")], { type: "text/plain" });
  let byteTicks = 0, progressTicks = 0, last = null;
  const t0 = Date.now();
  const res = await countPhrasesInFile(blob, {
    words: 12,
    preview: 3,
    onBytes: () => { byteTicks += 1; },
    onProgress: (c, bad) => { progressTicks += 1; last = { c, bad }; },
  });
  console.log(JSON.stringify({ mb: +(blob.size / 1048576).toFixed(1), ms: Date.now() - t0, count: res.count, invalid: res.invalid, byteTicks, progressTicks, last, preview: res.preview.length }));
}
main();
