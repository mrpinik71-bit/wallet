// Splits pasted text or a .txt file into individual recovery phrases. Kept apart
// from the balance scanning so the parsing can be reasoned about on its own.
import WORDLIST from "@/lib/bip39-words.json";

const WORD_SET = new Set(WORDLIST);
const PHRASE_SIZES = new Set([12, 15, 18, 21, 24]);
const SIZES_DESC = [24, 21, 18, 15, 12];

export const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

// The standard length closest to a line's word count, so an over-long line is
// still checked as one wallet instead of being split into pieces.
function nearestSize(count) {
  return SIZES_DESC.find((size) => count >= size) || 12;
}

// One line often carries more than the phrase — an index, a label, an address
// or a private key. Only the standard words are taken, so a phrase buried in
// that text is still recognised instead of being dropped with the whole line.
export function candidatesFromLine(line) {
  const tokens = tokenize(line);
  if (tokens.length < 12) return [];

  const found = [];
  const seen = new Set();
  const push = (phrase) => {
    const key = phrase.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    found.push(phrase);
  };

  // A line that is exactly one phrase is taken as-is; when a word is mistyped
  // it is still reported as invalid later instead of vanishing.
  if (PHRASE_SIZES.has(tokens.length)) push(tokens.join(" "));

  // Otherwise every uninterrupted run of standard words is a candidate.
  let run = [];
  const flush = () => {
    if (run.length >= 12) {
      if (PHRASE_SIZES.has(run.length)) push(run.join(" "));
      else if (run.length > 24) {
        for (let i = 0; i + 12 <= run.length; i += 12) push(run.slice(i, i + 12).join(" "));
      } else push(run.slice(0, 12).join(" "));
    }
    run = [];
  };
  for (const token of tokens) {
    if (WORD_SET.has(token)) run.push(token);
    else flush();
  }
  flush();

  // Every line is answered for: a line too long to be a phrase and with no
  // readable words in it is still checked, so it is counted and shown as
  // unreadable rather than being merged into the line below it.
  if (!found.length) push(tokens.slice(0, nearestSize(tokens.length)).join(" "));
  return found;
}

/** Splits a block of pasted text into phrases, one line at a time. */
export function parsePhrases(text) {
  const seen = new Set();
  const entries = [];
  const add = (phrase) => {
    const key = phrase.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ phrase, words: phrase.split(" ").length });
  };

  const blocks = String(text || "")
    .replace(/\r/g, "")
    .split(/\n\s*\n/);

  for (const block of blocks) {
    const before = entries.length;
    for (const line of block.split("\n")) {
      for (const phrase of candidatesFromLine(line)) add(phrase);
    }
    // A phrase wrapped over a couple of lines is joined back together.
    if (entries.length === before) {
      const tokens = tokenize(block);
      if (PHRASE_SIZES.has(tokens.length)) add(tokens.join(" "));
    }
  }
  return entries;
}

/** Streams phrases out of a file line by line, without ever holding the file. */
export async function* phrasesFromLines(lines) {
  let pending = [];

  const flush = () => {
    const out = [];
    if (PHRASE_SIZES.has(pending.length)) out.push(pending.join(" "));
    else if (pending.length > 24) {
      for (let i = 0; i + 12 <= pending.length; i += 12) out.push(pending.slice(i, i + 12).join(" "));
    } else if (pending.length >= 12) out.push(pending.slice(0, 12).join(" "));
    pending = [];
    return out;
  };

  for await (const line of lines) {
    const tokens = tokenize(line);
    if (tokens.length === 0) {
      // A blank line ends whatever phrase may have been wrapped above it.
      for (const phrase of flush()) yield phrase;
      continue;
    }

    // Every line that carries a whole phrase is answered on its own, so one bad
    // line can never swallow the phrase on the next one.
    const direct = candidatesFromLine(line);
    if (direct.length) {
      for (const phrase of flush()) yield phrase;
      for (const phrase of direct) yield phrase;
      continue;
    }

    // Only a short fragment can be part of a phrase wrapped over several lines.
    pending.push(...tokens);
    if (pending.length >= 24) for (const phrase of flush()) yield phrase;
  }

  for (const phrase of flush()) yield phrase;
}