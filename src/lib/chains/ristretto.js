// Ristretto255 / sr25519 primitives used by Polkadot accounts.
// Everything runs on-device — the recovery phrase never leaves the browser.
import { sha512 } from "@noble/hashes/sha512";

const P = 2n ** 255n - 19n;
const D = 37095705934669439343138083508754565189542113879843219016388785533085940283555n;
const D2 = (2n * D) % P;
const SQRT_M1 = 19681161376707505956807079304988542015446066515923890162744021073123829784752n;
const BX = 15112221349535400772501151409588531511454012693041857206046113283949847762202n;
const BY = 46316835694926478169428394003475163141307993866256225615783033603165251855960n;
const BASE = [BX, BY, 1n, (BX * BY) % P];
const IDENTITY = [0n, 1n, 1n, 0n];

const mod = (value) => ((value % P) + P) % P;
const isNegative = (value) => (value & 1n) === 1n;

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

/** sqrt(u/v), falling back to sqrt(i*u/v) when the ratio is a nonsquare. */
function sqrtRatio(u, v) {
  const v3 = mod(v * v * v);
  const v7 = mod(v3 * v3 * v);
  let r = mod(mod(u * v3) * powMod(mod(u * v7), (P - 5n) / 8n));
  const c = mod(v * r * r);
  if (c === mod(-u) || c === mod(-SQRT_M1 * u)) r = mod(r * SQRT_M1);
  return isNegative(r) ? mod(-r) : r;
}

const invsqrt = (value) => sqrtRatio(1n, value);
const INVSQRT_A_MINUS_D = invsqrt(mod(-1n - D));

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
    addend = pointAdd(addend, addend);
    k >>= 1n;
  }
  return result;
}

/** Ristretto compression of a point in extended coordinates (32 bytes). */
function compress(point) {
  const [X0, Y0, Z0, T0] = point;
  const u1 = mod((Z0 + Y0) * (Z0 - Y0));
  const u2 = mod(X0 * Y0);
  const inv = invsqrt(mod(u1 * u2 * u2));
  const d1 = mod(u1 * inv);
  const d2 = mod(u2 * inv);
  const zInv = mod(d1 * d2 * T0);

  const rotate = isNegative(mod(T0 * zInv));
  const X = rotate ? mod(SQRT_M1 * Y0) : X0;
  let Y = rotate ? mod(SQRT_M1 * X0) : Y0;
  const denominator = rotate ? mod(d1 * INVSQRT_A_MINUS_D) : d2;

  if (isNegative(mod(X * zInv))) Y = mod(-Y);

  let s = mod((Z0 - Y) * denominator);
  if (isNegative(s)) s = mod(-s);
  return leBytes(s);
}

/**
 * sr25519 public key from a 32-byte mini secret: ed25519-style clamping of
 * SHA-512(mini), divided by the cofactor, multiplied by the Ristretto basepoint.
 */
export function sr25519PublicKey(miniSecret) {
  const hash = sha512(miniSecret);
  const clamped = hash.slice(0, 32);
  clamped[0] &= 248;
  clamped[31] &= 63;
  clamped[31] |= 64;
  return compress(scalarMult(leBig(clamped) >> 3n));
}

export const basepointEncoding = () => compress(BASE);
export const multipleEncoding = (n) => compress(scalarMult(BigInt(n)));