import { generateMnemonic } from "@/lib/bip39";

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
export async function* autoPhrases({
  sizes = [12],
  shouldRun = () => true,
  everyMs = 1000,
  onPhrase,
} = {}) {
  const lengths = sizes?.length ? sizes : [12];
  let line = 0;
  let turn = 0;
  while (shouldRun()) {
    const beat = Date.now();
    // One length per beat, in order, so the scanner gets a steady trickle
    // instead of five phrases at once.
    const size = lengths[turn % lengths.length];
    turn += 1;
    const phrase = await generateMnemonic(size);
    line += 1;
    onPhrase?.(line, size);
    yield { phrase, words: size, line };
    // The pause between two phrases is the beat; the scanner checks whatever
    // has arrived in the meantime.
    const wait = everyMs - (Date.now() - beat);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  }
}