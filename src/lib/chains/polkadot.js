// Polkadot (DOT): sr25519 accounts from a recovery phrase (substrate-bip39).
// Everything runs on-device — the recovery phrase never leaves the browser.
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha512 } from "@noble/hashes/sha512";
import { blake2b } from "@noble/hashes/blake2b";
import bs58 from "bs58";
import WORDLIST from "@/lib/bip39-words.json";
import { sr25519PublicKey } from "@/lib/chains/ristretto";
import { twox128 } from "@/lib/chains/xxhash64";

const WORD_INDEX = new Map(WORDLIST.map((word, index) => [word, index]));
const SS58_PREFIX = 0; // Polkadot mainnet
const PUBLIC_KEY_LENGTH = 32;

function entropyOf(mnemonic) {
  const words = mnemonic.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const bits = words.map((word) => (WORD_INDEX.get(word) ?? 0).toString(2).padStart(11, "0")).join("");
  const entropyBits = bits.slice(0, bits.length - (words.length * 11) / 33);
  const entropy = new Uint8Array(Math.floor(entropyBits.length / 8));
  for (let i = 0; i < entropy.length; i += 1) {
    entropy[i] = parseInt(entropyBits.slice(i * 8, i * 8 + 8), 2);
  }
  return entropy;
}

/** substrate-bip39: PBKDF2 over the phrase entropy, keeping the first 32 bytes. */
export function miniSecretFromMnemonic(mnemonic, password = "") {
  const seed = pbkdf2(sha512, entropyOf(mnemonic), new TextEncoder().encode(`mnemonic${password}`), {
    c: 2048,
    dkLen: 64,
  });
  return seed.slice(0, 32);
}

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** SS58 account address: prefix + public key + blake2b checksum, base58 encoded. */
export function ss58Address(publicKey) {
  const body = concat(Uint8Array.of(SS58_PREFIX), publicKey);
  const checksum = blake2b(concat(new TextEncoder().encode("SS58PRE"), body), { dkLen: 64 }).slice(0, 2);
  return bs58.encode(concat(body, checksum));
}

export function publicKeyFromAddress(address) {
  return bs58.decode(address).slice(1, 1 + PUBLIC_KEY_LENGTH);
}

/** System.Account storage key for this account, used to read its DOT balance. */
export function accountStorageKey(publicKey) {
  return concat(
    twox128("System"),
    twox128("Account"),
    blake2b(publicKey, { dkLen: 16 }),
    publicKey,
  );
}

const cache = new Map();

/** DOT receiving address for this recovery phrase (Polkadot.js-style account). */
export function polkadotAddress(mnemonic) {
  if (!mnemonic) return "";
  const normalized = mnemonic.trim().split(/\s+/).join(" ").toLowerCase();
  if (!cache.has(normalized)) {
    cache.set(normalized, ss58Address(sr25519PublicKey(miniSecretFromMnemonic(normalized))));
  }
  return cache.get(normalized);
}