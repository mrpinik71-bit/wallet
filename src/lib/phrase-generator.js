import { generateMnemonic } from "@/lib/bip39";

/**
 * Produces random recovery phrases on a steady beat for the chain-read test.
 *
 * Every phrase is a real, checksum-valid BIP-39 phrase built from fresh
 * randomness on this device, so each one derives ordinary wallets — and nobody
 * holds their keys, so they are empty. A wallet that comes back with no balance
 * and a network read that did not answer therefore tells you exactly which
 * chain failed to reply, never that funds were missed.
 */
export async function* autoPhrases({
  sizes = [12],
  shouldRun = () => true,
  everyMs = 1000,
  onPhrase,
} = {}) {
  const lengths = sizes?.length ? sizes : [12];
  let line = 0;
  while (shouldRun()) {
    const beat = Date.now();
    for (const size of lengths) {
      if (!shouldRun()) return;
      const phrase = await generateMnemonic(size);
      line += 1;
      onPhrase?.(line);
      yield { phrase, words: size, line };
    }
    // One round of phrases a second: the pause is the beat, and the scanner
    // checks whatever arrived in the meantime.
    const wait = everyMs - (Date.now() - beat);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  }
}