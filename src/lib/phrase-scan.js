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

const DEDUPE_LIMIT = 300000;

/** A line is only a wallet when it is a real BIP-39 phrase (word list + checksum). */
const isRealPhrase = (phrase) =>
  isValidPhrase(
    String(phrase || "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean),
  );

/** Reads a .txt file and streams its phrases, de-duplicated. */
export async function* phrasesFromFile(file, { onCount, onInvalid, words } = {}) {
  const seen = new Set();
  let count = 0;
  let reported = 0;
  let invalid = 0;

  // Each line of the file is one phrase, using its first `words` words.
  const size = words || 12;
  for await (const entry of phrasesFromLines(readLines(file), size)) {
    const { phrase, line } = entry;
    // An unreadable line is not a wallet: it is counted on its own and never
    // sent through the scan.
    if (!isRealPhrase(phrase)) {
      invalid += 1;
      if (invalid % 200 === 0) onInvalid?.(invalid);
      continue;
    }
    if (seen.has(phrase)) continue;
    // The de-duplication set is capped: past a few hundred thousand entries a
    // repeat is simply scanned again instead of exhausting browser memory.
    if (seen.size < DEDUPE_LIMIT) seen.add(phrase);
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
export async function countPhrasesInFile(file, { onProgress, words } = {}) {
  const seen = new Set();
  const size = words || 12;
  let count = 0;
  let invalid = 0;

  for await (const entry of phrasesFromLines(readLines(file), size)) {
    if (!isRealPhrase(entry.phrase)) {
      invalid += 1;
      if (invalid % 500 === 0) onProgress?.(count, invalid);
      continue;
    }
    if (seen.has(entry.phrase)) continue;
    if (seen.size < DEDUPE_LIMIT) seen.add(entry.phrase);
    count += 1;
    if (count % 500 === 0) onProgress?.(count, invalid);
  }

  onProgress?.(count, invalid);
  return { count, invalid };
}

/** Scans phrases as they stream in and reports each wallet as soon as it lands. */
export async function scanPhraseStream(source, options = {}) {
  return scanPhrases(source, options);
}

/** Streams an in-memory list of entries (pasted text) through the same pipeline. */
export async function* entriesFromList(entries) {
  for (const entry of entries) yield entry;
}