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
import { stacksAddress } from "@/lib/chains/stacks";
import { babylonAddress } from "@/lib/chains/babylon";
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

// The third step of every BIP-44 path is the account index, so one recovery
// phrase holds a separate, independent set of addresses per account.
export function withAccount(path, account = 0) {
  if (!account) return path;
  const parts = path.split("/");
  if (parts.length < 4) return path;
  parts[3] = `${account}'`;
  return parts.join("/");
}

// A bulk scan derives millions of phrases in one session: an unbounded memo
// would grow until the tab runs out of memory, so it is cleared once it fills.
const remember = (key, value) => {
  if (cache.size > 400) cache.clear();
  cache.set(key, value);
  return value;
};

// The HD tree is built once per phrase and every chain's path derives from that
// same root: rebuilding it for each of a dozen paths was pure repeated work.
const roots = new Map();
function rootNode(mnemonic) {
  const cached = roots.get(mnemonic);
  if (cached) return cached;
  const root = HDNodeWallet.fromSeed(mnemonicSeed(mnemonic));
  if (roots.size > 64) roots.clear();
  roots.set(mnemonic, root);
  return root;
}

// Keys come from the phrase's seed, not from a checksum-validated mnemonic:
// a phrase whose checksum fails still controls real addresses, so it must
// derive and scan instead of being thrown away as unreadable.
function secpNode(mnemonic, path) {
  const key = `${path}|${mnemonic}`;
  if (!cache.has(key)) remember(key, rootNode(mnemonic).derivePath(path));
  return cache.get(key);
}

export function evmPrivateKey(mnemonic, account = 0) {
  return secpNode(mnemonic, withAccount(EVM_PATH, account)).privateKey;
}

export function evmAddress(mnemonic, account = 0) {
  return secpNode(mnemonic, withAccount(EVM_PATH, account)).address;
}

export function utxoKey(mnemonic, chainId, account = 0) {
  const chain = chains[chainId];
  const node = secpNode(mnemonic, withAccount(chain.path, account));
  const publicKey = fromHex(node.signingKey.compressedPublicKey);
  return {
    privateKey: node.privateKey,
    publicKey,
    address: segwitEncode(chain.hrp, 0, hash160(publicKey)),
    script: hash160(publicKey),
  };
}

export function tronPrivateKey(mnemonic, account = 0) {
  return secpNode(mnemonic, withAccount(chains.tron.path, account)).privateKey;
}

export function tronAddress(mnemonic, account = 0) {
  const node = secpNode(mnemonic, withAccount(chains.tron.path, account));
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

export function solanaKeypair(mnemonic, account = 0) {
  const seed = mnemonicSeed(mnemonic);
  const privateKey = ed25519PrivateKey(seed, [44, 501, account, 0]);
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
export function p2pkhAddress(mnemonic, chainId, account = 0) {
  const chain = chains[chainId];
  return base58Check(chain.p2pkh, hash160(compressedKey(mnemonic, withAccount(chain.path, account))));
}

export function xrpAddress(mnemonic, account = 0) {
  return base58Check(
    0x00,
    hash160(compressedKey(mnemonic, withAccount(chains.xrp.path, account))),
    XRP_ALPHABET,
  );
}

/** The receiving address one chain derives from this phrase. */
function addressOnChain(chain, mnemonic, evm, account) {
  if (chain.p2pkh) return p2pkhAddress(mnemonic, chain.id, account);
  if (chain.family === "evm") return evm;
  if (chain.family === "utxo") return utxoKey(mnemonic, chain.id, account).address;
  if (chain.family === "solana") return solanaKeypair(mnemonic, account).address;
  if (chain.family === "tron") return tronAddress(mnemonic, account);
  if (chain.family === "xrp") return xrpAddress(mnemonic, account);
  if (chain.family === "cardano") return cardanoAddress(mnemonic, account);
  // Polkadot accounts come from the substrate soft-derivation scheme, which
  // this wallet does not implement: the phrase has one Polkadot address.
  if (chain.family === "polkadot") return polkadotAddress(mnemonic);
  if (chain.family === "aptos") return aptosAddress(mnemonic, account);
  if (chain.family === "near") return nearAddress(mnemonic, account);
  // TON wallet contracts are only created from 24-word phrases.
  if (chain.family === "ton") {
    return mnemonic.trim().split(/\s+/).length === 24 ? tonAddress(mnemonic) : "";
  }
  if (chain.family === "sui") return suiAddress(mnemonic, account);
  // Stacks and Babylon both receive on a hash160 of the secp256k1 key.
  if (chain.family === "stacks") return stacksAddress(hash160(compressedKey(mnemonic, withAccount(chain.path, account))));
  if (chain.family === "babylon") return babylonAddress(hash160(compressedKey(mnemonic, withAccount(chain.path, account))));
  return "";
}

/** Every receiving address for one account of this phrase, keyed by chain id. */
export function getAddresses(mnemonic, account = 0) {
  if (!mnemonic) return {};
  const key = `addresses|${account}|${mnemonic}`;
  if (cache.has(key)) return cache.get(key);

  const result = {};
  let evm = "";
  try {
    evm = evmAddress(mnemonic, account);
  } catch {
    evm = "";
  }

  // Each chain derives on its own: one failing derivation must not remove the
  // addresses of every other chain, or a funded wallet would look empty.
  for (const chain of Object.values(chains)) {
    try {
      const address = addressOnChain(chain, mnemonic, evm, account);
      if (address) result[chain.id] = address;
    } catch {
      // This chain is skipped for this phrase only.
    }
  }
  remember(key, result);
  return result;
}

export function addressFor(mnemonic, chainId, account = 0) {
  return getAddresses(mnemonic, account)[chainId] || "";
}