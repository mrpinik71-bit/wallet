// Preparing one phrase for a scan: every address it controls, derived on this
// device. Kept in its own module so a scan can derive phrases on worker threads
// without dragging the networking half of the pipeline along.
import { cardanoAddresses } from "@/lib/chains/cardano";
import { evmAddress, getAddresses } from "@/lib/chains/derive";

export const WORD_COUNTS = [12, 15, 18, 21, 24];

/** Derives every address this phrase controls, on this device. */
export function prepare(entry) {
  // Any standard length is accepted — a phrase is never dropped just because it
  // differs from the selector, so every real phrase gets derived and checked.
  const size = entry.phrase.trim().split(/\s+/).filter(Boolean).length;
  if (!WORD_COUNTS.includes(size)) {
    return { invalid: true, error: "A recovery phrase has 12, 15, 18, 21 or 24 words." };
  }

  let addresses = {};
  try {
    addresses = getAddresses(entry.phrase);
  } catch {
    // One chain failing to derive must not hide the wallet: the EVM address
    // alone still shows funds on every EVM network.
    try {
      addresses = { ethereum: evmAddress(entry.phrase) };
    } catch {
      return { invalid: true, error: "Addresses could not be derived from this phrase." };
    }
  }

  // No address at all means nothing could be checked — say so instead of
  // reporting an empty wallet as if it had been scanned.
  if (!Object.keys(addresses).length) {
    return { invalid: true, error: "Addresses could not be derived from this phrase." };
  }

  let cardano = [];
  try {
    cardano = cardanoAddresses(entry.phrase);
  } catch {
    cardano = [];
  }

  return { entry, words: size, addresses, cardano };
}