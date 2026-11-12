// Cardano (ADA): BIP32-Ed25519 (V2) derivation of Shelley base addresses.
// Everything runs on-device — the recovery phrase never leaves the browser.
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha512 } from "@noble/hashes/sha512";
import { blake2b } from "@noble/hashes/blake2b";
import { hmac } from "@noble/hashes/hmac";
import WORDLIST from "@/lib/bip39-words.json";
import { bech32Encode } from "@/lib/chains/bech32";

const WORD_INDEX = new Map(WORDLIST.map((word, index) => [word, index]));

const P = 2n ** 255n - 19n;
const D = 37095705934669439343138083508754565189542113879843219016388785533085940283555n;
const D2 = (2n * D) % P;
const BX = 15112221349535400772501151409588531511454012693041857206046113283949847762202n;
const BY = 46316835694926478169428394003475163141307993866256225615783033603165251855960n;
const BASE = [BX, BY, 1n, (BX * BY) % P];
const IDENTITY = [0n, 1n, 1n, 0n];
const MASK_256 = (1n << 256n) - 1n;
const HARDENED = 0x80000000;

const mod = (value) => ((value % P) + P) % P;

function powMod(base, exponent) {
  let result = 1n;
  let b = mod(base);
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % P;
    b = (b * b) % P;
    e >>= 1n;
  }
  return result;
}

function leBytes(value, length = 32) {
  const out = new Uint8Array(length);
  let rest = value;
  for (let i = 0; i < length; i += 1) {
    out[i] = Number(rest & 0xffn);
    rest >>= 8n;
  }
  return out;
}

function leBig(bytes) {
  let value = 0n;
  for (let i = bytes.length - 1; i >= 0; i -= 1) value = (value << 8n) | BigInt(bytes[i]);
  return value;
}

// Extended twisted-Edwards coordinates: [X, Y, Z, T] with x = X/Z, y = Y/Z.
function pointAdd(p, q) {
  const [X1, Y1, Z1, T1] = p;
  const [X2, Y2, Z2, T2] = q;
  const A = mod((Y1 - X1) * (Y2 - X2));
  const B = mod((Y1 + X1) * (Y2 + X2));
  const C = mod(T1 * D2 * T2);
  const DD = mod(2n * Z1 * Z2);
  const E = mod(B - A);
  const F = mod(DD - C);
  const G = mod(DD + C);
  const H = mod(B + A);
  return [mod(E * F), mod(G * H), mod(F * G), mod(E * H)];
}

function scalarMult(scalar) {
  let result = IDENTITY;
  let addend = BASE;
  let k = scalar;
  while (k > 0n) {
    if (k & 1n) result = pointAdd(result, addend);
    addend = pointAdd(addend, addend); // the unified Edwards formula doubles safely
    k >>= 1n;
  }
  return result;
}

function encodePoint(point) {
  const [X, Y, Z] = point;
  const zInv = powMod(Z, P - 2n);
  const x = mod(X * zInv);
  const y = mod(Y * zInv);
  const bytes = leBytes(y);
  bytes[31] |= Number(x & 1n) << 7;
  return bytes;
}

function mnemonicEntropy(mnemonic) {
  const words = mnemonic.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const bits = words.map((word) => (WORD_INDEX.get(word) ?? 0).toString(2).padStart(11, "0")).join("");
  const entropyBits = bits.slice(0, bits.length - (words.length * 11) / 33);
  const entropy = new Uint8Array(Math.floor(entropyBits.length / 8));
  for (let i = 0; i < entropy.length; i += 1) {
    entropy[i] = parseInt(entropyBits.slice(i * 8, i * 8 + 8), 2);
  }
  return entropy;
}

/** Icarus master key: PBKDF2-HMAC-SHA512 over the phrase's entropy. */
function rootKey(mnemonic) {
  const out = pbkdf2(sha512, new Uint8Array(0), mnemonicEntropy(mnemonic), { c: 4096, dkLen: 96 });
  const kL = out.slice(0, 32);
  kL[0] &= 0b11111000;
  kL[31] &= 0b00011111;
  kL[31] |= 0b01000000;
  return { kL: leBig(kL), kR: leBig(out.slice(32, 64)), cc: out.slice(64, 96) };
}

function publicKey(node) {
  return encodePoint(scalarMult(node.kL));
}

// BIP32-Ed25519 (V2): the private part comes from the 0x00/0x02 tag, the chain
// code from a second HMAC under the 0x01/0x03 tag. ZL is 28 bytes, ZR is 32.
function childKey(node, index) {
  const hardened = index >= HARDENED;
  const build = (tag) => {
    const data = new Uint8Array(hardened ? 69 : 37);
    data[0] = tag;
    if (hardened) {
      data.set(leBytes(node.kL), 1);
      data.set(leBytes(node.kR), 33);
    } else {
      data.set(publicKey(node), 1);
    }
    new DataView(data.buffer).setUint32(data.length - 4, index >>> 0, true);
    return hmac(sha512, node.cc, data);
  };

  const z = build(hardened ? 0x00 : 0x02);
  const chainCode = build(hardened ? 0x01 : 0x03);
  return {
    kL: (node.kL + 8n * leBig(z.slice(0, 28))) & MASK_256,
    kR: (node.kR + leBig(z.slice(32))) & MASK_256,
    cc: chainCode.slice(32),
  };
}

const hard = (index) => (index + HARDENED) >>> 0;

function derivePath(root, segments) {
  return segments.reduce((node, segment) => childKey(node, segment), root);
}

const keyHash = (node) => blake2b(publicKey(node), { dkLen: 28 });

/** Shelley base address (addr1…): payment key hash + stake key hash. */
function baseAddress(payment, stake) {
  const payload = new Uint8Array(57);
  payload[0] = 0x01; // base address, mainnet: payment key hash + stake key hash
  payload.set(keyHash(payment), 1);
  payload.set(keyHash(stake), 29);
  return bech32Encode("addr", payload);
}

const cache = new Map();

/**
 * Addresses that hold this phrase's ADA: CIP-1852 (Daedalus, Ledger, most
 * current wallets) plus the earlier Icarus path used by Yoroi-era wallets.
 */
export function cardanoAddresses(mnemonic, account = 0) {
  if (!mnemonic) return [];
  const normalized = mnemonic.trim().split(/\s+/).join(" ").toLowerCase();
  const key = `${account}|${normalized}`;
  if (cache.has(key)) return cache.get(key);

  const root = rootKey(normalized);
  const build = (purpose) =>
    baseAddress(
      derivePath(root, [hard(purpose), hard(1815), hard(account), 0, 0]),
      derivePath(root, [hard(purpose), hard(1815), hard(account), 2, 0]),
    );

  const addresses = [build(1852), build(44)];
  // A bulk scan walks through millions of phrases: keeping every address list
  // forever would exhaust memory, so the memo stays small and is simply reset.
  if (cache.size > 500) cache.clear();
  cache.set(key, addresses);
  return addresses;
}

export function cardanoAddress(mnemonic, account = 0) {
  return cardanoAddresses(mnemonic, account)[0] || "";
}