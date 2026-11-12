import WORDLIST from "@/lib/bip39-words.json";

const WORD_INDEX = new Map(WORDLIST.map((word, index) => [word, index]));

function bytesToBits(bytes) {
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  return bits;
}

async function sha256(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

/** Generates a standards-compliant BIP-39 recovery phrase in the browser. */
export async function generateMnemonic(wordCount = 12) {
  if (wordCount !== 12 && wordCount !== 24) {
    throw new Error("Recovery phrase must be 12 or 24 words.");
  }
  const entropyBytes = wordCount === 24 ? 32 : 16;
  const entropy = crypto.getRandomValues(new Uint8Array(entropyBytes));
  const checksumLength = (entropy.length * 8) / 32;
  const checksum = bytesToBits(await sha256(entropy)).slice(0, checksumLength);
  const bits = bytesToBits(entropy) + checksum;

  const words = [];
  for (let i = 0; i < wordCount; i += 1) {
    words.push(WORDLIST[parseInt(bits.slice(i * 11, i * 11 + 11), 2)]);
  }
  return words.join(" ");
}

/** Validates word list membership and the BIP-39 checksum. */
export async function validateMnemonic(phrase) {
  const words = phrase.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (![12, 15, 18, 21, 24].includes(words.length)) {
    return { valid: false, reason: "A recovery phrase has 12 or 24 words." };
  }
  const unknown = words.find((word) => !WORD_INDEX.has(word));
  if (unknown) {
    return { valid: false, reason: `"${unknown}" is not a valid word in the standard list.` };
  }

  const bits = words.map((word) => WORD_INDEX.get(word).toString(2).padStart(11, "0")).join("");
  const checksumLength = (words.length * 11) / 33;
  const entropyBits = bits.slice(0, bits.length - checksumLength);
  const givenChecksum = bits.slice(bits.length - checksumLength);

  const entropy = new Uint8Array(entropyBits.length / 8);
  for (let i = 0; i < entropy.length; i += 1) {
    entropy[i] = parseInt(entropyBits.slice(i * 8, i * 8 + 8), 2);
  }
  const expected = bytesToBits(await sha256(entropy)).slice(0, checksumLength);
  if (expected !== givenChecksum) {
    return { valid: false, reason: "That phrase failed its checksum — check the words and their order." };
  }
  return { valid: true, wordCount: words.length };
}

export function pickRandomIndexes(wordCount, count = 3) {
  const picked = new Set();
  while (picked.size < count && picked.size < wordCount) {
    picked.add(Math.floor(Math.random() * wordCount));
  }
  return [...picked].sort((a, b) => a - b);
}