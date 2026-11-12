// Bulk recovery-phrase balance scanner. Everything runs on this device: phrases
// are only used to derive addresses, and only those addresses are sent to RPCs.
import { scanPhrases } from "@/lib/chains/scan-pipeline";
import { SCAN_ASSETS, SCAN_CHAINS } from "@/lib/chains/scan-catalog";
import { parsePhrases, phrasesFromLines } from "@/lib/phrase-lines";
import { readLines } from "@/lib/scan-file";

export const scanAssets = SCAN_ASSETS;
export const scanChains = SCAN_CHAINS;
export { parsePhrases };

const DEDUPE_LIMIT = 300000;

/** Reads a .txt file and streams its phrases, de-duplicated. */
export async function* phrasesFromFile(file, { onCount, words } = {}) {
  const seen = new Set();
  let count = 0;
  let reported = 0;

  for await (const phrase of phrasesFromLines(readLines(file))) {
    // Only phrases of the chosen length are scanned; the rest of the file is
    // skipped rather than checked and thrown away.
    if (words && phrase.split(" ").length !== words) continue;
    const key = phrase.toLowerCase();
    if (seen.has(key)) continue;
    // The de-duplication set is capped: past a few hundred thousand entries a
    // repeat is simply scanned again instead of exhausting browser memory.
    if (seen.size < DEDUPE_LIMIT) seen.add(key);
    count += 1;
    if (count - reported >= 5000) {
      reported = count;
      onCount?.(count);
    }
    yield { phrase, words: phrase.split(" ").length };
  }

  onCount?.(count);
}

/** Scans phrases as they stream in and reports each wallet as soon as it lands. */
export async function scanPhraseStream(source, options = {}) {
  return scanPhrases(source, options);
}

/** Streams an in-memory list of entries (pasted text) through the same pipeline. */
export async function* entriesFromList(entries) {
  for (const entry of entries) yield entry;
}