import { phrasesFromLines } from "@/lib/phrase-lines";
import { isValidPhrase } from "@/lib/phrase-checksum";
import { readLines } from "@/lib/scan-file";

const WORDS = ["abandon","ability","able","about","above","absent","absorb","abstract","absurd","abuse","access","accident"];

async function count(file) {
  let count = 0, invalid = 0, lines = 0;
  const t0 = Date.now();
  for await (const entry of phrasesFromLines(readLines(file), 12)) {
    lines += 1;
    if (isValidPhrase(String(entry.phrase).trim().split(/\s+/).filter(Boolean))) count += 1; else invalid += 1;
  }
  return { ms: Date.now() - t0, count, invalid, lines };
}

function makeFile(n) {
  // Real BIP-39 phrases would be ideal; use a known valid phrase repeated with a counter word replaced.
  const valid = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const rows = [];
  for (let i = 0; i < n; i += 1) rows.push(`${i + 1}. ${valid}`);
  return new Blob([rows.join("\n")], { type: "text/plain" });
}

const sizes = [20000, 100000];
const out = [];
for (const n of sizes) {
  const blob = makeFile(n);
  const r = await count(blob);
  out.push({ lines: n, mb: +(blob.size / 1048576).toFixed(1), ...r, linesPerSec: Math.round(r.lines / (r.ms / 1000)) });
}
out.push({ heapMB: +(process.memoryUsage().heapUsed / 1048576).toFixed(0) });
console.log(JSON.stringify(out, null, 1));
