// Aptos (APT): ed25519 account at m/44'/637'/0'/0'/0'.
// Everything runs on-device — the recovery phrase never leaves the browser.
import { sha3_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import nacl from "tweetnacl";
import { ed25519PrivateKey, mnemonicSeed } from "@/lib/chains/slip10";

const cache = new Map();

/** Aptos address: sha3-256(public key ‖ 0x00), the single-signer authentication key. */
export function aptosAddress(mnemonic, account = 0) {
  if (!mnemonic) return "";
  const normalized = mnemonic.trim().split(/\s+/).join(" ").toLowerCase();
  const cacheKey = `${account}|${normalized}`;
  if (!cache.has(cacheKey)) {
    const key = ed25519PrivateKey(mnemonicSeed(normalized), [44, 637, account, 0, 0]);
    const publicKey = nacl.sign.keyPair.fromSeed(key).publicKey;
    const authKey = new Uint8Array(publicKey.length + 1);
    authKey.set(publicKey);
    cache.set(cacheKey, `0x${bytesToHex(sha3_256(authKey))}`);
  }
  return cache.get(cacheKey);
}