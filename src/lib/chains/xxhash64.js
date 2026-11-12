// xxHash64 — needed for Substrate storage keys (twox128 of a pallet/entry name).
const MASK = (1n << 64n) - 1n;
const P1 = 11400714785074694791n;
const P2 = 14029467366897019727n;
const P3 = 1609587929392839161n;
const P4 = 9650029242287828579n;
const P5 = 2870177450012600261n;

const rotl = (value, bits) => ((value << BigInt(bits)) | (value >> BigInt(64 - bits))) & MASK;
const mul = (a, b) => (a * b) & MASK;
const round = (acc, lane) => mul(rotl((acc + mul(lane, P2)) & MASK, 31), P1);

function readU64(bytes, offset) {
  let value = 0n;
  for (let i = 7; i >= 0; i -= 1) value = (value << 8n) | BigInt(bytes[offset + i]);
  return value;
}

function readU32(bytes, offset) {
  return BigInt(
    bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24),
  );
}

function mergeRound(acc, value) {
  return mul(acc ^ round(0n, value), P1) + P4;
}

export function xxhash64(input, seed = 0n) {
  const bytes = input instanceof Uint8Array ? input : new TextEncoder().encode(input);
  const length = bytes.length;
  let offset = 0;
  let hash;

  if (length >= 32) {
    let v1 = (seed + P1 + P2) & MASK;
    let v2 = (seed + P2) & MASK;
    let v3 = seed;
    let v4 = (seed - P1) & MASK;
    while (offset + 32 <= length) {
      v1 = round(v1, readU64(bytes, offset));
      v2 = round(v2, readU64(bytes, offset + 8));
      v3 = round(v3, readU64(bytes, offset + 16));
      v4 = round(v4, readU64(bytes, offset + 24));
      offset += 32;
    }
    hash = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) & MASK;
    hash = mergeRound(hash, v1);
    hash = mergeRound(hash, v2);
    hash = mergeRound(hash, v3);
    hash = mergeRound(hash, v4);
  } else {
    hash = (seed + P5) & MASK;
  }

  hash = (hash + BigInt(length)) & MASK;

  while (offset + 8 <= length) {
    hash ^= round(0n, readU64(bytes, offset));
    hash = (mul(rotl(hash, 27), P1) + P4) & MASK;
    offset += 8;
  }
  if (offset + 4 <= length) {
    hash ^= mul(readU32(bytes, offset), P1);
    hash = (mul(rotl(hash, 23), P2) + P3) & MASK;
    offset += 4;
  }
  while (offset < length) {
    hash ^= mul(BigInt(bytes[offset]), P5);
    hash = mul(rotl(hash, 11), P1);
    offset += 1;
  }

  hash ^= hash >> 33n;
  hash = mul(hash, P2);
  hash ^= hash >> 29n;
  hash = mul(hash, P3);
  hash ^= hash >> 32n;
  return hash;
}

const leBytes = (value) => Uint8Array.from({ length: 8 }, (_, i) => Number((value >> BigInt(8 * i)) & 0xffn));

/** Substrate's twox128 hash: xxHash64 with seeds 0 and 1, little-endian. */
export function twox128(input) {
  const bytes = input instanceof Uint8Array ? input : new TextEncoder().encode(input);
  const out = new Uint8Array(16);
  out.set(leBytes(xxhash64(bytes, 0n)));
  out.set(leBytes(xxhash64(bytes, 1n)), 8);
  return out;
}