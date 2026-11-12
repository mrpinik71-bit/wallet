// NEAR Protocol: ed25519 implicit account at m/44'/397'/0'.
// Everything runs on-device — the recovery phrase never leaves the browser.
import { bytesToHex } from "@noble/hashes/utils";
import nacl from "tweetnacl";
import { ed25519PrivateKey, mnemonicSeed } from "@/lib/chains/slip10";

const cache = new Map();

/** NEAR implicit account id: hex of the ed25519 public key. */
export function nearAddress(mnemonic, account = 0) {
  if (!mnemonic) return "";
  const normalized = mnemonic.trim().split(/\s+/).join(" ").toLowerCase();
  const cacheKey = `${account}|${normalized}`;
  if (!cache.has(cacheKey)) {
    const key = ed25519PrivateKey(mnemonicSeed(normalized), [44, 397, account]);
    cache.set(cacheKey, bytesToHex(nacl.sign.keyPair.fromSeed(key).publicKey));
  }
  return cache.get(cacheKey);
}