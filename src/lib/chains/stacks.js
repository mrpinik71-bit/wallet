// Stacks (STX): c32check address encoding and live balance.
import { sha256 } from "@noble/hashes/sha256";
import { chains } from "@/lib/chains/config";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const VERSION = 22; // mainnet single-signature address, the one that starts with SP

/**
 * Crockford base32 (the Stacks alphabet), big-endian, with one character kept
 * for every leading zero byte of the payload.
 */
function c32encode(bytes) {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);

  let out = "";
  while (value > 0n) {
    out = ALPHABET[Number(value % 32n)] + out;
    value /= 32n;
  }

  let zeros = 0;
  for (const byte of bytes) {
    if (byte !== 0) break;
    zeros += 1;
  }
  return ALPHABET[0].repeat(zeros) + out;
}

/** The Stacks address a key's hash160 receives on. */
export function stacksAddress(hash) {
  const checksum = sha256(sha256(Uint8Array.from([VERSION, ...hash]))).slice(0, 4);
  return `SP${c32encode(Uint8Array.from([...hash, ...checksum]))}`;
}

// Two public nodes serve the same API, so a busy one is not a failed chain.
// api.hiro.so is a second hostname of the same indexer with its own request
// budget: when one is rate-limited the other still answers.
const HOSTS = [chains.stacks.api, "https://api.hiro.so"];
// Each read starts on a different host, so a burst is shared between them.
let turn = 0;
// A host that answered 429 is over its window for a moment: asking it again
// straight away only extends the refusal, so it is left alone until then.
const paused = new Map();
const pause = (host) => new Promise((resolve) => setTimeout(resolve, Math.max(0, (paused.get(host) || 0) - Date.now())));

/** STX balance in whole coins (1 STX = 1,000,000 microSTX). */
export async function stacksBalance(address, endpoint) {
  let lastError = null;
  const order = endpoint ? [endpoint, ...HOSTS.filter((host) => host !== endpoint)] : HOSTS;
  const rotated = order.length > 1 ? [...order.slice(turn % order.length), ...order.slice(0, turn % order.length)] : order;
  turn += 1;
  for (const host of rotated) {
    if (paused.has(host)) await pause(host);
    try {
      const response = await fetch(`${host}/extended/v1/address/${address}/balances`);
      if (response.status === 429) {
        paused.set(host, Date.now() + 1800);
        lastError = new Error("Stacks network error (429).");
        continue;
      }
      if (!response.ok) {
        lastError = new Error(`Stacks network error (${response.status}).`);
        continue;
      }
      const data = await response.json();
      paused.delete(host);
      return Number(data?.stx?.balance || 0) / 1e6;
    } catch (cause) {
      lastError = cause;
    }
  }
  throw lastError || new Error("Stacks network error.");
}