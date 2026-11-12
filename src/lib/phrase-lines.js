// Splits pasted text or a .txt file into individual recovery phrases. Kept apart
// from the balance scanning so the parsing can be reasoned about on its own.

export const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

// Every standard recovery-phrase length.
const VALID_LENGTHS = [12, 15, 18, 21, 24];

// One line is one phrase. The selected length is used first, but a line whose
// own word count is a standard length is scanned whole as well — so a 24-word
// phrase can never be cut down to the wrong wallet (and missed) because the
// selector was still on 12.
function phrasesFromLine(line, size) {
  const tokens = tokenize(line);
  if (!tokens.length) return [];

  const out = [];
  const add = (count) => {
    if (count < 12 || count > tokens.length) return;
    const phrase = tokens.slice(0, count).join(" ");
    if (!out.some((item) => item.phrase === phrase)) out.push({ phrase, words: count });
  };

  add(size);
  if (VALID_LENGTHS.includes(tokens.length) && tokens.length !== size) add(tokens.length);
  return out;
}

/** Splits a block of pasted text into phrases, line by line. */
export function parsePhrases(text, size = 12) {
  const seen = new Set();
  const entries = [];
  const lines = String(text || "").replace(/\r/g, "").split("\n");

  lines.forEach((raw, position) => {
    for (const { phrase, words } of phrasesFromLine(raw, size)) {
      if (seen.has(phrase)) continue;
      seen.add(phrase);
      entries.push({ phrase, words, line: position + 1 });
    }
  });

  return entries;
}

/** Streams the file line by line, one phrase per line, without holding it. */
export async function* phrasesFromLines(lines, size = 12) {
  let line = 0;
  for await (const raw of lines) {
    line += 1;
    for (const { phrase, words } of phrasesFromLine(raw, size)) yield { phrase, words, line };
  }
}