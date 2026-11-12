// Splits pasted text or a .txt file into individual recovery phrases. Kept apart
// from the balance scanning so the parsing can be reasoned about on its own.

export const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

// One line is one phrase, checked exactly as the file lists it: nothing is
// joined from the line above or below, and one line never becomes two phrases.
function phraseFromLine(line) {
  const tokens = tokenize(line);
  if (tokens.length < 12) return "";
  return tokens.join(" ");
}

/** Splits a block of pasted text into phrases, line by line. */
export function parsePhrases(text) {
  const seen = new Set();
  const entries = [];
  const lines = String(text || "").replace(/\r/g, "").split("\n");

  lines.forEach((raw, position) => {
    const phrase = phraseFromLine(raw);
    if (!phrase || seen.has(phrase)) return;
    seen.add(phrase);
    entries.push({ phrase, words: phrase.split(" ").length, line: position + 1 });
  });

  return entries;
}

/** Streams the file line by line, one phrase per line, without holding it. */
export async function* phrasesFromLines(lines) {
  let line = 0;
  for await (const raw of lines) {
    line += 1;
    const phrase = phraseFromLine(raw);
    if (phrase) yield { phrase, line };
  }
}