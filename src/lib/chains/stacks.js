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
const HOSTS = [chains.stacks.api, "https://stacks-node-api.mainnet.stacks.co"];

/** STX balance in whole coins (1 STX = 1,000,000 microSTX). */
export async function stacksBalance(address) {
  let lastError = null;
  for (const host of HOSTS) {
    try {
      const response = await fetch(`${host}/extended/v1/address/${address}/balances`);
      if (!response.ok) {
        lastError = new Error(`Stacks network error (${response.status}).`);
        continue;
      }
      const data = await response.json();
      return Number(data?.stx?.balance || 0) / 1e6;
    } catch (cause) {
      lastError = cause;
    }
  }
  throw lastError || new Error("Stacks network error.");
}