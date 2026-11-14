// Babylon: the Cosmos-style account this wallet derives, plus its BABY balance.
import { chains } from "@/lib/chains/config";
import { bech32Encode } from "@/lib/chains/bech32";

/** The bbn1… address a key's hash160 receives on. */
export function babylonAddress(hash) {
  return bech32Encode(chains.babylon.hrp, hash);
}

/** BABY balance in whole coins (1 BABY = 1,000,000 ubbn). */
export async function babylonBalance(address) {
  const endpoints = [chains.babylon.api, ...(chains.babylon.apis || [])];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}/cosmos/bank/v1beta1/balances/${address}`);
      if (!response.ok) {
        lastError = new Error(`Babylon network error (${response.status}).`);
        continue;
      }
      const data = await response.json();
      const staked = (data?.balances || []).find((coin) => coin.denom === "ubbn");
      return Number(staked?.amount || 0) / 1e6;
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error("Babylon network error.");
    }
  }

  throw lastError || new Error("Babylon network error.");
}