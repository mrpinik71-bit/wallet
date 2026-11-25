import { generateMnemonic, validateMnemonic } from "@/lib/bip39";

/**
 * Produces random recovery phrases for the chain-read test, one at a time and on
 * a slow beat: 12 words, then 15, 18, 21 and 24 — one per second, so a full
 * round of the five lengths takes five seconds — then it starts over and keeps
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

export async function* autoPhrases({
  sizes = PHRASE_SIZES,
  shouldRun = () => true,
  everyMs = 1000,
  onPhrase,
} = {}) {
  const lengths = sizes?.length ? sizes : PHRASE_SIZES;
  let line = 0;
  let turn = 0;
  while (shouldRun()) {
    const beat = Date.now();
    // One length per beat, in order, so the scanner gets a steady trickle
    // instead of five phrases at once.
    const size = lengths[turn % lengths.length];
    turn += 1;
    // Fresh words every time: each phrase is drawn from new entropy, every one
    // of its words comes from the standard BIP-39 list, and its own checksum is
    // checked before it moves on. A line that has already been through the scan
    // is thrown away and drawn again instead of being checked twice.
    let phrase = await generateMnemonic(size);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (!USED.has(phrase) && (await validateMnemonic(phrase)).valid) break;
      phrase = await generateMnemonic(size);
    }
    USED.add(phrase);
    line += 1;
    onPhrase?.(line, size);
    yield { phrase, words: size, line };
    // The pause between two phrases is the beat; the scanner checks whatever
    // has arrived in the meantime.
    const wait = everyMs - (Date.now() - beat);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  }
}