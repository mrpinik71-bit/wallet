// SLIP-0010 ed25519 derivation, shared by the ed25519 account chains
// (Solana, Aptos, NEAR). Runs on-device — the recovery phrase never leaves the browser.
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha512 } from "@noble/hashes/sha512";
import { hmac } from "@noble/hashes/hmac";

/** BIP39 seed for a recovery phrase (64 bytes). */
export function mnemonicSeed(mnemonic) {
  const normalized = mnemonic.trim().split(/\s+/).join(" ").normalize("NFKD");
  return pbkdf2(sha512, new TextEncoder().encode(normalized), new TextEncoder().encode("mnemonic"), {
    c: 2048,
    dkLen: 64,
  });
}

/** SLIP-0010 private key; every segment is hardened, as ed25519 requires. */
export function ed25519PrivateKey(seed, segments) {
  let digest = hmac(sha512, new TextEncoder().encode("ed25519 seed"), seed);
  let key = digest.slice(0, 32);
  let chainCode = digest.slice(32);
  for (const segment of segments) {
    const data = new Uint8Array(37);
    data[0] = 0;
    data.set(key, 1);
    new DataView(data.buffer).setUint32(33, (segment | 0x80000000) >>> 0, false);
    digest = hmac(sha512, chainCode, data);
    key = digest.slice(0, 32);
    chainCode = digest.slice(32);
  }
  return key;
}