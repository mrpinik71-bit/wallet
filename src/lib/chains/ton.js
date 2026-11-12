// TON (The Open Network): wallet v4R2 addresses from a 24-word recovery phrase.
// Runs on-device — the phrase never leaves the browser.
import nacl from "tweetnacl";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";

// Wallet v4R2 contract code, serialized as a bag of cells.
const WALLET_CODE =
  "te6ccgECFAEAAtQAART/APSkE/S88sgLAQIBIAIDAgFIBAUE+PKDCNcYINMf0x/THwL4I7vyZO1E0NMf0x/T//QE0VFDuvKhUVG68qIF+QFUEGT5EPKj+AAkpMjLH1JAyx9SMMv/UhD0AMntVPgPAdMHIcAAn2xRkyDXSpbTB9QC+wDoMOAhwAHjACHAAuMAAcADkTDjDQOkyMsfEssfy/8QERITAubQAdDTAyFxsJJfBOAi10nBIJJfBOAC0x8hghBwbHVnvSKCEGRzdHK9sJJfBeAD+kAwIPpEAcjKB8v/ydDtRNCBAUDXIfQEMFyBAQj0Cm+hMbOSXwfgBdM/yCWCEHBsdWe6kjgw4w0DghBkc3RyupJfBuMNBgcCASAICQB4AfoA9AQw+CdvIjBQCqEhvvLgUIIQcGx1Z4MesXCAGFAEywUmzxZY+gIZ9ADLaRfLH1Jgyz8gyYBA+wAGAIpQBIEBCPRZMO1E0IEBQNcgyAHPFvQAye1UAXKwjiOCEGRzdHKDHrFwgBhQBcsFUAPPFiP6AhPLassfyz/JgED7AJJfA+ICASAKCwBZvSQrb2omhAgKBrkPoCGEcNQICEekk30pkQzmkD6f+YN4EoAbeBAUiYcVnzGEAgFYDA0AEbjJftRNDXCx+AA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA4PABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AAG7SB/oA1NQi+QAFyMoHFcv/ydB3dIAYyMsFywIizxZQBfoCFMtrEszMyXP7AMhAFIEBCPRR8qcCAHCBAQjXGPoA0z/IVCBHgQEI9FHyp4IQbm90ZXB0gBjIywXLAlAGzxZQBPoCFMtqEssfyz/Jc/sAAgBsgQEI1xj6ANM/MFIkgQEI9Fnyp4IQZHN0cnB0gBjIywXLAlAFzxZQA/oCE8tqyx8Syz/Jc/sAAAr0AMntVA==";

const WALLET_ID = 698983191;
const TON_SEED_SALT = "TON default seed";

const toHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

/** Reads a serialized bag of cells into plain descriptors. */
function parseBoc(bytes) {
  let p = 4; // magic
  const flags = bytes[p++];
  const hasIndex = (flags >> 7) & 1;
  const sizeBytes = flags & 7;
  const offBytes = bytes[p++];
  const readInt = (size) => {
    let value = 0;
    for (let i = 0; i < size; i += 1) value = value * 256 + bytes[p++];
    return value;
  };
  const count = readInt(sizeBytes);
  const rootCount = readInt(sizeBytes);
  readInt(sizeBytes); // absent cells
  readInt(offBytes); // total cell size
  const roots = [];
  for (let i = 0; i < rootCount; i += 1) roots.push(readInt(sizeBytes));
  if (hasIndex) p += count * offBytes;

  const cells = [];
  for (let i = 0; i < count; i += 1) {
    const refsDescriptor = bytes[p++];
    const bitsDescriptor = bytes[p++];
    const dataLength = Math.ceil(bitsDescriptor / 2);
    const data = bytes.slice(p, p + dataLength);
    p += dataLength;
    const refs = [];
    for (let r = 0; r < (refsDescriptor % 8); r += 1) refs.push(readInt(sizeBytes));
    cells.push({ refsDescriptor, bitsDescriptor, data, refs });
  }
  return { cells, roots };
}

/** TVM cell hash and depth: descriptors, data, then child depths and child hashes. */
function cellHash(cell, cells, memo) {
  if (memo.has(cell)) return memo.get(cell);
  const children = cell.refs.map((index) => cellHash(cells[index], cells, memo));
  const repr = new Uint8Array(2 + cell.data.length + children.length * 34);
  repr[0] = cell.refsDescriptor;
  repr[1] = cell.bitsDescriptor;
  repr.set(cell.data, 2);
  let offset = 2 + cell.data.length;
  for (const child of children) {
    repr[offset] = Math.floor(child.depth / 256);
    repr[offset + 1] = child.depth % 256;
    offset += 2;
  }
  for (const child of children) {
    repr.set(child.hash, offset);
    offset += 32;
  }
  const result = { hash: sha256(repr), depth: children.length ? Math.max(...children.map((c) => c.depth)) + 1 : 0 };
  memo.set(cell, result);
  return result;
}

/** Hash of a cell built from bits (with a closing bit) and already-hashed refs. */
function buildCell(bits, bitLength, refs) {
  const dataLength = Math.ceil(bitLength / 8);
  const repr = new Uint8Array(2 + dataLength + refs.length * 34);
  repr[0] = refs.length;
  repr[1] = Math.floor(bitLength / 8) * 2 + (bitLength % 8 ? 1 : 0);
  repr.set(bits.slice(0, dataLength), 2);
  let offset = 2 + dataLength;
  for (const ref of refs) {
    repr[offset] = Math.floor(ref.depth / 256);
    repr[offset + 1] = ref.depth % 256;
    offset += 2;
  }
  for (const ref of refs) {
    repr.set(ref.hash, offset);
    offset += 32;
  }
  return { hash: sha256(repr), depth: refs.length ? Math.max(...refs.map((r) => r.depth)) + 1 : 0 };
}

let cachedCode = null;

function walletCode() {
  if (!cachedCode) {
    const binary = atob(WALLET_CODE);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const { cells, roots } = parseBoc(bytes);
    cachedCode = cellHash(cells[roots[0]], cells, new Map());
  }
  return cachedCode;
}

function crc16(bytes) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i += 1) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

/** ed25519 key pair for a TON phrase (PBKDF2 with TON's own seed salt). */
export function tonKey(phrase) {
  const words = phrase.trim().replace(/\s+/g, " ").normalize("NFKD");
  const encoder = new TextEncoder();
  const entropy = hmac(sha512, encoder.encode(words), encoder.encode(""));
  const seed = pbkdf2(sha512, entropy, encoder.encode(TON_SEED_SALT), { c: 100000, dkLen: 64 });
  return nacl.sign.keyPair.fromSeed(seed.slice(0, 32));
}

const cache = new Map();

/** Wallet v4R2 address (non-bounceable) derived from a 24-word phrase. */
export function tonAddress(phrase) {
  const key = `ton|${phrase}`;
  if (cache.has(key)) return cache.get(key);

  const { publicKey } = tonKey(phrase);
  const data = new Uint8Array(41);
  new DataView(data.buffer).setUint32(4, WALLET_ID, false);
  data.set(publicKey, 8);
  data[40] = 0x40; // empty plugin dictionary plus the cell's closing bit

  const dataCell = buildCell(data, 322, []);
  // State init: no split depth, no special, code ref, data ref, empty library.
  const stateInit = buildCell(Uint8Array.from([0x34]), 6, [walletCode(), dataCell]);

  const hash = stateInit.hash;
  const body = new Uint8Array(34);
  body[0] = 0x51; // non-bounceable, mainnet
  body[1] = 0x00; // basechain
  body.set(hash, 2);
  const sum = crc16(body);
  const full = new Uint8Array(36);
  full.set(body);
  full[34] = sum >> 8;
  full[35] = sum & 0xff;

  let binary = "";
  for (const byte of full) binary += String.fromCharCode(byte);
  const address = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_");
  cache.set(key, address);
  return address;
}

/** Raw "workchain:hash" form, which some TON APIs prefer. */
export function tonRawAddress(phrase) {
  const { publicKey } = tonKey(phrase);
  const data = new Uint8Array(41);
  new DataView(data.buffer).setUint32(4, WALLET_ID, false);
  data.set(publicKey, 8);
  data[40] = 0x40;
  const stateInit = buildCell(Uint8Array.from([0x34]), 6, [walletCode(), buildCell(data, 322, [])]);
  return `0:${toHex(stateInit.hash)}`;
}