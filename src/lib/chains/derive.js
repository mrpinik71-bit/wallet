// Key derivation for every chain family this wallet supports.
// Everything here runs on-device: the recovery phrase never leaves the browser.
import { HDNodeWallet, keccak256 } from "ethers";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { chains, EVM_PATH } from "@/lib/chains/config";
import { segwitEncode } from "@/lib/chains/bech32";
import { cardanoAddress } from "@/lib/chains/cardano";
import { polkadotAddress } from "@/lib/chains/polkadot";
import { aptosAddress } from "@/lib/chains/aptos";
import { nearAddress } from "@/lib/chains/near";
import { tonAddress } from "@/lib/chains/ton";
import { suiAddress } from "@/lib/chains/sui";
import { ed25519PrivateKey, mnemonicSeed } from "@/lib/chains/slip10";

export const toHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
export const fromHex = (hex) =>
  Uint8Array.from((hex.replace(/^0x/, "").match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16)));

export function hash160(bytes) {
  return ripemd160(sha256(bytes));
}

export function sha256d(bytes) {
  return sha256(sha256(bytes));
}

const cache = new Map();

// A bulk scan derives millions of phrases in one session: an unbounded memo
// would grow until the tab runs out of memory, so it is cleared once it fills.
const remember = (key, value) => {
  if (cache.size > 400) cache.clear();
  cache.set(key, value);
  return value;
};

// Keys come from the phrase's seed, not from a checksum-validated mnemonic:
// a phrase whose checksum fails still controls real addresses, so it must
// derive and scan instead of being thrown away as unreadable.
function secpNode(mnemonic, path) {
  const key = `${path}|${mnemonic}`;
  if (!cache.has(key)) remember(key, HDNodeWallet.fromSeed(mnemonicSeed(mnemonic)).derivePath(path));
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

const XRP_ALPHABET = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";

function base58Check(version, payload, alphabet = null) {
  const body = Uint8Array.from([version, ...payload]);
  const full = Uint8Array.from([...body, ...sha256d(body).slice(0, 4)]);
  if (!alphabet) return bs58.encode(full);
  let value = 0n;
  for (const byte of full) value = (value << 8n) | BigInt(byte);
  let out = "";
  while (value > 0n) {
    out = alphabet[Number(value % 58n)] + out;
    value /= 58n;
  }
  for (const byte of full) {
    if (byte !== 0) break;
    out = alphabet[0] + out;
  }
  return out;
}

const compressedKey = (mnemonic, path) => fromHex(secpNode(mnemonic, path).signingKey.compressedPublicKey);

/** Legacy P2PKH address (Dogecoin, Dash) from the chain's own derivation path. */
export function p2pkhAddress(mnemonic, chainId) {
  const chain = chains[chainId];
  return base58Check(chain.p2pkh, hash160(compressedKey(mnemonic, chain.path)));
}

export function xrpAddress(mnemonic) {
  return base58Check(0x00, hash160(compressedKey(mnemonic, chains.xrp.path)), XRP_ALPHABET);
}

/** Every receiving address for this recovery phrase, keyed by chain id. */
export function getAddresses(mnemonic) {
  if (!mnemonic) return {};
  const key = `addresses|${mnemonic}`;
  if (cache.has(key)) return cache.get(key);

  const result = {};
  const evm = evmAddress(mnemonic);
  for (const chain of Object.values(chains)) {
    if (chain.p2pkh) result[chain.id] = p2pkhAddress(mnemonic, chain.id);
    else if (chain.family === "evm") result[chain.id] = evm;
    else if (chain.family === "utxo") result[chain.id] = utxoKey(mnemonic, chain.id).address;
    else if (chain.family === "solana") result[chain.id] = solanaKeypair(mnemonic).address;
    else if (chain.family === "tron") result[chain.id] = tronAddress(mnemonic);
    else if (chain.family === "xrp") result[chain.id] = xrpAddress(mnemonic);
    else if (chain.family === "cardano") result[chain.id] = cardanoAddress(mnemonic);
    else if (chain.family === "polkadot") result[chain.id] = polkadotAddress(mnemonic);
    else if (chain.family === "aptos") result[chain.id] = aptosAddress(mnemonic);
    else if (chain.family === "near") result[chain.id] = nearAddress(mnemonic);
    // TON wallet contracts are only created from 24-word phrases.
    else if (chain.family === "ton") {
      if (mnemonic.trim().split(/\s+/).length === 24) result[chain.id] = tonAddress(mnemonic);
    } else if (chain.family === "sui") result[chain.id] = suiAddress(mnemonic);
  }
  remember(key, result);
  return result;
}

export function addressFor(mnemonic, chainId) {
  return getAddresses(mnemonic)[chainId] || "";
}