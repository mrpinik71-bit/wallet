import { phrasesFromFile } from "@/lib/phrase-scan";
async function main() {
  const valid = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const junk = "hello world this is not a phrase at all really truly nope nope nope nope";
  const rows = [];
  for (let i = 0; i < 6; i += 1) { rows.push(`${i + 1}. ${valid}`); rows.push(junk); }
  const blob = new Blob([rows.join("\n")], { type: "text/plain" });
  const collect = async (onlyValid) => {
    const out = []; let invalid = 0, counted = 0;
    for await (const e of phrasesFromFile(blob, { words: 12, onlyValid, onInvalid: (n) => { invalid = n; }, onCount: (n) => { counted = n; } })) out.push({ line: e.line, unreadable: !!e.unreadable });
    return { yielded: out.length, invalid: out.filter((o) => o.unreadable).length, counted, onInvalid: invalid, onCount: counted };
  };
  console.log(JSON.stringify({ all: await collect(false), onlyValid: await collect(true) }));
}
main();
