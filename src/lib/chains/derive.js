// Key derivation for every chain family this wallet supports.
// Everything here runs on-device: the recovery phrase never leaves the browser.
import { HDNodeWallet, keccak256 } from "ethers";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { sha512 } from "@noble/hashes/sha512";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { hmac } from "@noble/hashes/hmac";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { chains, EVM_PATH } from "@/lib/chains/config";
import { segwitEncode } from "@/lib/chains/bech32";

export const toHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
export const fromHex = (hex) =>
  Uint8Array.from((hex.replace(/^0x/, "").match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16)));

export function hash160(bytes) {
  return ripemd160(sha256(bytes));
}

export function sha256d(bytes) {
  return sha256(sha256(bytes));
}

function mnemonicSeed(mnemonic) {
  const normalized = mnemonic.trim().split(/\s+/).join(" ").normalize("NFKD");
  return pbkdf2(sha512, new TextEncoder().encode(normalized), new TextEncoder().encode("mnemonic"), {
    c: 2048,
    dkLen: 64,
  });
}

/** SLIP-0010 ed25519 derivation (Solana, TON-style keys). */
function ed25519PrivateKey(seed, segments) {
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

const cache = new Map();

function secpNode(mnemonic, path) {
  const key = `${path}|${mnemonic}`;
  if (!cache.has(key)) cache.set(key, HDNodeWallet.fromPhrase(mnemonic.trim(), "", path));
  return cache.get(key);
}

export function evmPrivateKey(mnemonic) {
  return secpNode(mnemonic, EVM_PATH).privateKey;
}

export function evmAddress(mnemonic) {
  return secpNode(mnemonic, EVM_PATH).address;
}

export function utxoKey(mnemonic, chainId) {
  const chain = chains[chainId];
  const node = secpNode(mnemonic, chain.path);
  const publicKey = fromHex(node.signingKey.compressedPublicKey);
  return {
    privateKey: node.privateKey,
    publicKey,
    address: segwitEncode(chain.hrp, 0, hash160(publicKey)),
    script: hash160(publicKey),
  };
}

export function tronPrivateKey(mnemonic) {
  return secpNode(mnemonic, chains.tron.path).privateKey;
}

export function tronAddress(mnemonic) {
  const node = secpNode(mnemonic, chains.tron.path);
  const hash = fromHex(keccak256(fromHex(node.signingKey.publicKey)));
  const payload = new Uint8Array(21);
  payload[0] = 0x41;
  payload.set(hash.slice(12), 1);
  const checksum = sha256d(payload).slice(0, 4);
  const withChecksum = new Uint8Array(payload.length + 4);
  withChecksum.set(payload);
  withChecksum.set(checksum, payload.length);
  return bs58.encode(withChecksum);
}

export function solanaKeypair(mnemonic) {
  const seed = mnemonicSeed(mnemonic);
  const privateKey = ed25519PrivateKey(seed, [44, 501, 0, 0]);
  const pair = nacl.sign.keyPair.fromSeed(privateKey);
  return {
    secretKey: pair.secretKey,
    publicKey: pair.publicKey,
    address: bs58.encode(pair.publicKey),
  };
}

/** Every receiving address for this recovery phrase, keyed by chain id. */
export function getAddresses(mnemonic) {
  if (!mnemonic) return {};
  const key = `addresses|${mnemonic}`;
  if (cache.has(key)) return cache.get(key);

  const result = {};
  const evm = evmAddress(mnemonic);
  for (const chain of Object.values(chains)) {
    if (chain.family === "evm") result[chain.id] = evm;
  }
  result.bitcoin = utxoKey(mnemonic, "bitcoin").address;
  result.litecoin = utxoKey(mnemonic, "litecoin").address;
  result.solana = solanaKeypair(mnemonic).address;
  result.tron = tronAddress(mnemonic);
  cache.set(key, result);
  return result;
}

export function addressFor(mnemonic, chainId) {
  return getAddresses(mnemonic)[chainId] || "";
}