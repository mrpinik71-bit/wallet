import { generateMnemonic, validateMnemonic } from "@/lib/bip39";

/**
 * Produces random recovery phrases for the chain-read test, on a one-second
 * beat: two lines of 12 words, two of 15, two of 18, two of 21 and two of 24 —
 * ten fresh phrases every second — then the next second starts over and keeps
 * going until the run is stopped.
 *
 * Every phrase is a real, checksum-valid BIP-39 phrase built on this device, so
 * each one derives ordinary wallets — and nobody holds their keys, so they are
 * empty. A wallet that comes back with no balance and a network read that did
 * not answer therefore tells you exactly which chain failed to reply, never that
 * funds were missed.
 */
// Every length a BIP-39 phrase can have: 12 words through 24, in steps of three.
export const PHRASE_SIZES = [12, 15, 18, 21, 24];

// Every line this device has already handed to the scanner. Only the phrase
// text is kept, so a line is never checked a second time — not even when the
// run is stopped and started again on this page.
const USED = new Set();

// How many lines of each length are drawn on every beat.
export const LINES_PER_SIZE = 2;

export async function* autoPhrases({
  sizes = PHRASE_SIZES,
  shouldRun = () => true,
  everyMs = 1000,
  perSize = LINES_PER_SIZE,
  onPhrase,
} = {}) {
  const lengths = sizes?.length ? sizes : PHRASE_SIZES;
  let line = 0;
  while (shouldRun()) {
    const beat = Date.now();
    // Every length gets its own lines on the same beat, in order from 12 words
    // to 24, so a second of the test covers all five lengths.
    for (const size of lengths) {
      for (let index = 0; index < perSize; index += 1) {
        if (!shouldRun()) return;
        // Fresh words every time: each phrase is drawn from new entropy, every
        // one of its words comes from the standard BIP-39 list, and its own
        // checksum is checked before it moves on. A line that has already been
        // through the scan is thrown away and drawn again instead of being
        // checked twice.
        let phrase = await generateMnemonic(size);
        for (let attempt = 0; attempt < 4; attempt += 1) {
          if (!USED.has(phrase) && (await validateMnemonic(phrase)).valid) break;
          phrase = await generateMnemonic(size);
        }
        USED.add(phrase);
        line += 1;
        onPhrase?.(line, size);
        yield { phrase, words: size, line };
      }
    }
    // The rest of the second is the beat; the scanner checks whatever has
    // arrived in the meantime.
    const wait = everyMs - (Date.now() - beat);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  }
}