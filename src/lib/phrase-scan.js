// Bulk recovery-phrase balance scanner. Everything runs on this device: phrases
// are only used to derive addresses, and only those addresses are sent to RPCs.
import { scanPhrases } from "@/lib/chains/scan-pipeline";
import { SCAN_ASSETS, SCAN_CHAINS } from "@/lib/chains/scan-catalog";
import { parsePhrases, phrasesFromLines } from "@/lib/phrase-lines";
import { isValidPhrase } from "@/lib/phrase-checksum";
import { readLines } from "@/lib/scan-file";

export const scanAssets = SCAN_ASSETS;
export const scanChains = SCAN_CHAINS;
export { parsePhrases };

/**
 * A line is only a wallet when it is a real BIP-39 phrase (word list + checksum)
 * of the length chosen on the page: picking 24 means the file is read as 24-word
 * phrases, so a line of another length is not one of the wallets being scanned.
 */
const isRealPhrase = (phrase, size) => {
  const words = String(phrase || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (size && words.length !== size) return false;
  return isValidPhrase(words);
};

/**
 * Reads a .txt file and streams every line of it, in order: a real phrase is a
 * wallet, and a line that fails the word list or checksum is handed on too, so
 * it is reported as unreadable instead of disappearing. Nothing is skipped.
 */
export async function* phrasesFromFile(file, { onCount, onInvalid, words, onlyValid = false } = {}) {
  let count = 0;
  let reported = 0;
  let invalid = 0;

  // Each line of the file is one phrase, using its first `words` words.
  const size = words || 12;
  for await (const entry of phrasesFromLines(readLines(file), size)) {
    const { phrase, line } = entry;
    if (!isRealPhrase(phrase, size)) {
      invalid += 1;
      if (invalid % 50 === 0) onInvalid?.(invalid);
      // A line that failed the word list or checksum is never a wallet: it is
      // only counted, so the chain check receives exactly the phrases that
      // passed the checksum pass and nothing else.
      if (onlyValid) continue;
      yield { phrase, words: entry.words || size, line, unreadable: true };
      continue;
    }
    count += 1;
    // Reported often, so the detected total on screen grows while the file is read.
    if (count - reported >= 200) {
      reported = count;
      onCount?.(count);
    }
    yield { phrase, words: entry.words || size, line };
  }

  onCount?.(count);
  onInvalid?.(invalid);
}

/**
 * Reads a whole file first and counts the wallets in it, without checking any
 * chain: the number of real wallets is known before the scan begins, and the
 * lines that are not recovery phrases are counted apart.
 */
export async function countPhrasesInFile(file, { onProgress, onBytes, words, preview = 0 } = {}) {
  const size = words || 12;
  let count = 0;
  let invalid = 0;
  let seen = 0;
  // The first lines of the file, kept in order so the screen can show them line
  // by line without holding the whole file in memory.
  const head = [];

  // The whole file is read through line by line: every real phrase is counted,
  // and every line that is not one is counted as unreadable, so the two numbers
  // always account for the entire file.
  for await (const entry of phrasesFromLines(readLines(file, { onBytes }), size)) {
    const unreadable = !isRealPhrase(entry.phrase, size);
    if (head.length < preview) head.push({ phrase: entry.phrase, line: entry.line, unreadable });
    if (unreadable) invalid += 1;
    else count += 1;

    seen += 1;
    // A big file is read for minutes on a phone: handing the thread back now and
    // then lets the screen keep painting, so the read never looks frozen.
    if (seen % 4000 === 0) {
      onProgress?.(count, invalid);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  onProgress?.(count, invalid);
  return { count, invalid, preview: head };
}

/** Scans phrases as they stream in and reports each wallet as soon as it lands. */
export async function scanPhraseStream(source, options = {}) {
  return scanPhrases(source, options);
}

/** Streams an in-memory list of entries (pasted text) through the same pipeline. */
export async function* entriesFromList(entries) {
  for (const entry of entries) yield entry;
}