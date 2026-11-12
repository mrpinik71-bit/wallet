// Sui: ed25519 account derived at m/44'/784'/0'/0'/0', address hashed from the
// key. Runs on-device — the recovery phrase never leaves the browser.
import nacl from "tweetnacl";
import { blake2b } from "@noble/hashes/blake2b";
import { ed25519PrivateKey, mnemonicSeed } from "@/lib/chains/slip10";

const toHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const cache = new Map();

export function suiKeypair(phrase, account = 0) {
  const seed = mnemonicSeed(phrase);
  const privateKey = ed25519PrivateKey(seed, [44, 784, account, 0, 0]);
  const pair = nacl.sign.keyPair.fromSeed(privateKey);
  return { privateKey, publicKey: pair.publicKey };
}

/** Sui address: blake2b-256 of the flagged ed25519 public key. */
export function suiAddress(phrase, account = 0) {
  const key = `sui|${account}|${phrase}`;
  if (cache.has(key)) return cache.get(key);

  const pair = suiKeypair(phrase, account);
  const flagged = new Uint8Array(pair.publicKey.length + 1);
  flagged[0] = 0x00; // ed25519 scheme flag
  flagged.set(pair.publicKey, 1);
  const address = `0x${toHex(blake2b(flagged, { dkLen: 32 }))}`;
  cache.set(key, address);
  return address;
}