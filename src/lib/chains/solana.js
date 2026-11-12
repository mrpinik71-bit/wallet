// Solana adapter: native SOL balance and transfers signed on-device.
import bs58 from "bs58";
import nacl from "tweetnacl";
import { chains } from "@/lib/chains/config";
import { solanaKeypair } from "@/lib/chains/derive";

const LAMPORTS = 1e9;
const SYSTEM_PROGRAM = new Uint8Array(32);

function u32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function u64(value) {
  let remaining = BigInt(value);
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 8; i += 1) {
    bytes[i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}

function cat(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function rpc(method, params) {
  const response = await fetch(chains.solana.rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await response.json();
  if (json.error) {
    const detail = json.error.data?.err;
    const suffix = detail ? ` (${typeof detail === "string" ? detail : JSON.stringify(detail)})` : "";
    throw new Error(`${json.error.message || "Solana network error."}${suffix}`);
  }
  return json.result;
}

/** Turns node errors into something a person can act on. */
function readableError(error) {
  const text = String(error?.message || error || "");
  if (/InsufficientFundsForRent/i.test(text)) {
    return new Error("Send at least 0.00089 SOL when the recipient is a brand-new Solana account.");
  }
  if (/InvalidAccountForFee|AccountNotFound/i.test(text)) {
    return new Error("This wallet can't pay Solana fees yet — add SOL to it first.");
  }
  if (/insufficient lamports|insufficient funds/i.test(text)) {
    return new Error("Not enough SOL to cover the amount plus the network fee.");
  }
  return error instanceof Error ? error : new Error(text || "The Solana transfer failed.");
}

export async function solanaBalance(address) {
  const result = await rpc("getBalance", [address]);
  return (result?.value || 0) / LAMPORTS;
}

export function isSolanaAddress(value) {
  try {
    return bs58.decode(String(value).trim()).length === 32;
  } catch {
    return false;
  }
}

export async function signSolanaTransfer({ mnemonic, to, amount }) {
  if (!isSolanaAddress(to)) throw new Error("That is not a valid Solana address.");
  const { secretKey, publicKey } = solanaKeypair(mnemonic);
  const lamports = BigInt(Math.round(Number(amount) * LAMPORTS));
  if (lamports <= 0n) throw new Error("Enter an amount greater than zero.");

  const latest = await rpc("getLatestBlockhash", [{ commitment: "confirmed" }]);
  const blockhash = bs58.decode(latest.value.blockhash);
  const recipient = bs58.decode(String(to).trim());

  const message = cat([
    Uint8Array.of(1, 0, 1), // 1 signer, 0 readonly signed, 1 readonly unsigned
    Uint8Array.of(3),
    publicKey,
    recipient,
    SYSTEM_PROGRAM,
    blockhash,
    Uint8Array.of(1), // one instruction
    Uint8Array.of(2), // system program index
    Uint8Array.of(2, 0, 1), // accounts: from, to
    Uint8Array.of(12), // data length
    u32(2), // SystemInstruction::Transfer
    u64(lamports),
  ]);

  const signature = nacl.sign.detached(message, secretKey);
  return bs58.encode(cat([Uint8Array.of(1), signature, message]));
}

export async function solanaSend({ mnemonic, to, amount }) {
  const transaction = await signSolanaTransfer({ mnemonic, to, amount });
  try {
    return await rpc("sendTransaction", [transaction, { encoding: "base58" }]);
  } catch (error) {
    throw readableError(error);
  }
}