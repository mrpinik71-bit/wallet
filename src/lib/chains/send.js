// Fee estimates and the actual signed broadcast for every supported family.
import { chains } from "@/lib/chains/config";
import { getAddresses } from "@/lib/chains/derive";
import { evmFee, evmSend } from "@/lib/chains/evm";
import { utxoFee, utxoSend } from "@/lib/chains/utxo";
import { isSolanaAddress, solanaSend } from "@/lib/chains/solana";
import { isTronAddress, tronFee, tronSend } from "@/lib/chains/tron";
import { isUtxoAddress } from "@/lib/chains/utxo";
import { isAddress } from "ethers";

export function validateAddress(coin, value) {
  const address = String(value || "").trim();
  if (!address) return "Enter the recipient address.";
  if (coin.family === "evm") return isAddress(address) ? "" : `That is not a valid ${chains[coin.chain].name} address.`;
  if (coin.family === "utxo") return isUtxoAddress(coin.chain, address) ? "" : `That is not a valid ${chains[coin.chain].name} segwit address.`;
  if (coin.family === "solana") return isSolanaAddress(address) ? "" : "That is not a valid Solana address.";
  if (coin.chain === "tron") return isTronAddress(address) ? "" : "That is not a valid TRON address.";
  return "This asset cannot be sent yet.";
}

/** Fee in the chain's native coin. */
export async function estimateFee({ coin, mnemonic, to, amount, account = 0 }) {
  const from = getAddresses(mnemonic, account)[coin.chain];
  if (coin.family === "evm") return evmFee({ chainId: coin.chain, coin, from, to, amount });
  if (coin.family === "utxo") {
    const { fee } = await utxoFee(coin.chain, from, amount);
    return fee;
  }
  if (coin.family === "solana") return 0.000005;
  if (coin.chain === "tron") return tronFee(coin);
  return 0;
}

export async function sendAsset({ coin, mnemonic, to, amount, account = 0 }) {
  const address = String(to || "").trim();
  const invalid = validateAddress(coin, address);
  if (invalid) throw new Error(invalid);
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error("Enter an amount greater than zero.");

  if (coin.family === "evm") {
    return evmSend({ chainId: coin.chain, coin, mnemonic, to: address, amount: value, account });
  }
  if (coin.family === "utxo") {
    return utxoSend({ chainId: coin.chain, mnemonic, to: address, amount: value, account });
  }
  if (coin.family === "solana") return solanaSend({ mnemonic, to: address, amount: value, account });
  if (coin.chain === "tron") return tronSend({ coin, mnemonic, to: address, amount: value, account });
  throw new Error("This asset cannot be sent yet.");
}