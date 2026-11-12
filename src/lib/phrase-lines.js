// Turns a pasted list or a .txt file into individual recovery phrases. Kept
// apart from the balance scanning so the parsing can be reasoned about alone.
//
// Detection is dictionary + checksum based: numbering ("1."), labels
// ("Phrase 1:", "Seed"), commas, quotes, JSON brackets and addresses are skipped
// instead of shifting a phrase by a word, and when a line carries extra text the
// window that passes the BIP-39 checksum is the phrase. That is what makes a
// real list of a thousand phrases detect completely instead of coming up empty.
import { isValidPhrase, STANDARD_LENGTHS } from "@/lib/phrase-checksum";

const LONGEST = 24;

export const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

const wordsOf = (items) => items.map((item) => item.word);

// Longest first: a 24-word phrase must not be cut into two 12-word guesses.
const WINDOW_LENGTHS = [...STANDARD_LENGTHS].sort((a, b) => b - a);

const validAt = (items, start, length) =>
  start >= 0 && start + length <= items.length && isValidPhrase(wordsOf(items.slice(start, start + length)));

/**
 * Where the phrase starts inside a run of words.
 * A short run is a phrase plus a label, so a window that ends at the last word
 * is preferred ("Phrase 1: …" drops "Phrase", a line with trailing junk keeps
 * its first words). In a long run several phrases are glued together, and the
 * window that a second phrase follows is the real one — that is what keeps a
 * lucky checksum hit from knocking the rest of the list out of step.
 */
function bestWindow(items, size) {
  const limit = items.length;

  if (limit <= LONGEST + 2) {
    for (const length of WINDOW_LENGTHS) {
      if (validAt(items, limit - length, length)) return { start: limit - length, length };
    }
  }

  for (let start = 0; start + 12 <= limit; start += 1) {
    const candidates = [];
    for (const length of WINDOW_LENGTHS) {
      if (!validAt(items, start, length)) continue;
      // How many phrases of this length follow one another: a real run keeps
      // going, a lucky checksum hit does not.
      let chain = 0;
      while (chain < 3 && validAt(items, start + chain * length, length)) chain += 1;
      candidates.push({ start, length, chain });
    }
    if (candidates.length) {
      candidates.sort(
        (a, b) =>
          b.chain - a.chain ||
          Number(a.length !== size) - Number(b.length !== size) ||
          b.length - a.length,
      );
      return candidates[0];
    }
  }
  return null;
}

/**
 * Reading state shared by the pasted-text and streamed-file paths.
 * A line holding a full phrase is that phrase; a short line is part of one (a
 * phrase wrapped over several lines) and waits in a buffer until it is whole.
 */
function createReader(size) {
  const queue = [];
  let buffer = [];

  const record = (items) => {
    if (!items.length) return;
    queue.push({
      phrase: wordsOf(items).join(" "),
      words: items.length,
      line: items[0].line,
    });
  };

  // One run of words can hold several phrases: take a real phrase where the
  // checksum finds one, otherwise fall back to the selected length.
  const takeRun = (items, size) => {
    let rest = items;
    let fixed = 0;
    while (rest.length >= 12) {
      // Once this run's phrase length is known, a remainder that is a multiple
      // of it holds that many phrases — never one long phrase.
      if (fixed && rest.length > fixed && rest.length % fixed === 0) {
        record(rest.slice(0, fixed));
        rest = rest.slice(fixed);
        continue;
      }
      if (STANDARD_LENGTHS.includes(rest.length)) {
        record(rest);
        return;
      }
      const window = bestWindow(rest, size);
      if (window) {
        record(rest.slice(window.start, window.start + window.length));
        fixed = window.length;
        rest = rest.slice(window.start + window.length);
        continue;
      }
      record(rest.slice(0, size));
      rest = rest.slice(size);
    }
  };

  const flush = (size) => {
    if (!buffer.length) return;
    takeRun(buffer, size);
    buffer = [];
  };

  return {
    push(raw, line) {
      const words = tokenize(raw);
      if (!words.length) return;
      const items = words.map((word) => ({ word, line }));

      if (words.length < 12) {
        // A fragment of a phrase carried on from the previous line.
        buffer.push(...items);
        if (buffer.length >= 12 && (STANDARD_LENGTHS.includes(buffer.length) || buffer.length > LONGEST)) {
          flush(size);
        }
        return;
      }

      takeRun(items, size);
    },
    end: (size) => flush(size),
    has: () => queue.length > 0,
    next: () => queue.shift(),
  };
}

/** Splits a block of pasted text into phrases, line by line. */
export function parsePhrases(text, size = 12) {
  const reader = createReader(size);
  const seen = new Set();
  const entries = [];

  String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .forEach((line, index) => reader.push(line, index + 1));
  reader.end(size);

  while (reader.has()) {
    const entry = reader.next();
    if (seen.has(entry.phrase)) continue;
    seen.add(entry.phrase);
    entries.push(entry);
  }
  return entries;
}

/** Streams the file line by line, one phrase per line, without holding it. */
export async function* phrasesFromLines(lines, size = 12) {
  const reader = createReader(size);
  let line = 0;

  for await (const raw of lines) {
    line += 1;
    reader.push(String(raw || "").replace(/\r/g, ""), line);
    while (reader.has()) yield reader.next();
  }

  reader.end(size);
  while (reader.has()) yield reader.next();
}