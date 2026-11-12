// Splits pasted text or a .txt file into individual recovery phrases. Kept apart
// from the balance scanning so the parsing can be reasoned about on its own.

export const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

// One line is one phrase: its first `size` words are the wallet, so a line
// carrying extra text after the phrase is still checked correctly.
function phraseFromLine(line, size) {
  const tokens = tokenize(line);
  if (tokens.length < size) return "";
  return tokens.slice(0, size).join(" ");
}

/** Splits a block of pasted text into phrases, line by line. */
export function parsePhrases(text, size = 12) {
  const seen = new Set();
  const entries = [];
  const lines = String(text || "").replace(/\r/g, "").split("\n");

  lines.forEach((raw, position) => {
    const phrase = phraseFromLine(raw, size);
    if (!phrase || seen.has(phrase)) return;
    seen.add(phrase);
    entries.push({ phrase, words: size, line: position + 1 });
  });

  return entries;
}

/** Streams the file line by line, one phrase per line, without holding it. */
export async function* phrasesFromLines(lines, size = 12) {
  let line = 0;
  for await (const raw of lines) {
    line += 1;
    const phrase = phraseFromLine(raw, size);
    if (phrase) yield { phrase, line };
  }
}