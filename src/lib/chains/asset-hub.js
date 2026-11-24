// Polkadot Asset Hub: USDT and USDC are pallet-assets entries on Asset Hub, not
// coins on the relay chain, so their balance is a storage read on Asset Hub.
import { blake2b } from "@noble/hashes/blake2b";
import { twox128 } from "@/lib/chains/xxhash64";
import { publicKeyFromAddress } from "@/lib/chains/polkadot";

/** Every Asset Hub node the wallet reads through, primary first. */
export const ASSET_HUB_ENDPOINTS = [
  "https://polkadot-asset-hub-rpc.polkadot.io",
  "https://asset-hub-polkadot-rpc.dwellir.com",
  "https://polkadot-asset-hub-rpc.dwellir.com",
];

const encode = (text) => new TextEncoder().encode(text);
const blake128 = (data) => blake2b(data, { dkLen: 16 });
const u32 = (value) => Uint8Array.of(value & 255, (value >> 8) & 255, (value >> 16) & 255, (value >> 24) & 255);

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

const hexOf = (bytes) => `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;

/** Assets.Account(assetId, account) — the storage key for one wallet's asset balance. */
export function assetAccountKey(assetId, address) {
  const owner = publicKeyFromAddress(address);
  const id = u32(Number(assetId));
  return hexOf(
    concat(twox128(encode("Assets")), twox128(encode("Account")), blake128(id), id, blake128(owner), owner),
  );
}

/** AssetAccount starts with balance (u128 LE), so the first 16 bytes are the amount. */
function amountOf(result) {
  if (!result) return 0;
  const bytes = Uint8Array.from((result.replace(/^0x/, "").match(/.{2}/g) || []).map((byte) => parseInt(byte, 16)));
  if (bytes.length < 16) return 0;
  let amount = 0n;
  for (let byte = 15; byte >= 0; byte -= 1) amount = (amount << 8n) | BigInt(bytes[byte]);
  return Number(amount);
}

/** Raw asset amounts for many wallets of one asset, as one batched storage read. */
export async function assetBalancesMany(pairs) {
  const balances = new Map();
  const keys = [];
  const positions = [];
  pairs.forEach((pair, index) => {
    try {
      keys.push(assetAccountKey(pair.assetId, pair.address));
      positions.push(index);
    } catch {
      // An unreadable address is left out and reported as a failed read.
    }
  });
  if (!keys.length) return balances;

  const calls = keys.map((key, index) => ({
    jsonrpc: "2.0",
    id: index + 1,
    method: "state_getStorage",
    params: [key],
  }));

  let body = null;
  let lastError = null;
  for (const endpoint of ASSET_HUB_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(calls),
      });
      if (!response.ok) throw new Error(`Polkadot Asset Hub error (${response.status}).`);
      const parsed = await response.json();
      if (!Array.isArray(parsed)) throw new Error("Polkadot Asset Hub error.");
      body = parsed;
      break;
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error("Polkadot Asset Hub error.");
    }
  }
  if (!body) throw lastError || new Error("Polkadot Asset Hub error.");

  for (const item of body) {
    if (!item || item.error) continue;
    const index = positions[item.id - 1];
    if (index === undefined) continue;
    // No entry means this account never held the asset.
    balances.set(index, amountOf(item.result));
  }
  return balances;
}

/** One wallet's USDT/USDC on Asset Hub, in whole tokens. */
export async function assetHubBalance(address, assetId, decimals = 6) {
  if (!address || !assetId) return 0;
  const balances = await assetBalancesMany([{ address, assetId }]);
  return (balances.get(0) || 0) / 10 ** decimals;
}