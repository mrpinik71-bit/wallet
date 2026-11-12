// TRON adapter: balances, TRC-20 reads and signed transfers via TronGrid.
import { SigningKey } from "ethers";
import bs58 from "bs58";
import { chains } from "@/lib/chains/config";
import { fromHex, toHex, tronAddress, tronPrivateKey } from "@/lib/chains/derive";

const API = chains.tron.api;

async function post(path, body) {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`TRON network error (${response.status}).`);
  return response.json();
}

function rawAddress(address) {
  const bytes = bs58.decode(String(address).trim());
  if (bytes.length !== 25) throw new Error("That is not a valid TRON address.");
  return bytes;
}

const hexAddress = (address) => toHex(rawAddress(address).slice(0, 21));
const padParameter = (address) => toHex(rawAddress(address).slice(1, 21)).padStart(64, "0");

export function isTronAddress(value) {
  try {
    return bs58.decode(String(value).trim()).length === 25;
  } catch {
    return false;
  }
}

function decodeMessage(message) {
  if (!message || !/^[0-9a-fA-F]+$/.test(message)) return message;
  try {
    return new TextDecoder().decode(fromHex(message));
  } catch {
    return message;
  }
}

export async function tronBalance(address) {
  const data = await post("/wallet/getaccount", { address: hexAddress(address), visible: false });
  return (data.balance || 0) / 1e6;
}

export async function trc20Balance(address, coin) {
  const data = await post("/wallet/triggerconstantcontract", {
    owner_address: hexAddress(address),
    contract_address: hexAddress(coin.address),
    function_selector: "balanceOf(address)",
    parameter: padParameter(address),
    visible: false,
  });
  const hex = data?.constant_result?.[0];
  if (!hex) return 0;
  return Number(BigInt(`0x${hex}`)) / 10 ** coin.decimals;
}

async function signAndBroadcast(transaction, mnemonic) {
  const signature = new SigningKey(tronPrivateKey(mnemonic)).sign(fromHex(transaction.txID));
  const bytes = new Uint8Array(65);
  bytes.set(fromHex(signature.r), 0);
  bytes.set(fromHex(signature.s), 32);
  bytes[64] = signature.yParity;

  const result = await post("/wallet/broadcasttransaction", { ...transaction, signature: [toHex(bytes)] });
  if (result.result === false) throw new Error(decodeMessage(result.message) || "The network rejected the transaction.");
  return result.txid || transaction.txID;
}

export async function tronSend({ mnemonic, coin, to, amount }) {
  const from = tronAddress(mnemonic);
  if (!isTronAddress(to)) throw new Error("That is not a valid TRON address.");

  if (coin.kind === "token") {
    const units = BigInt(Math.round(Number(amount) * 10 ** coin.decimals));
    const data = await post("/wallet/triggersmartcontract", {
      owner_address: hexAddress(from),
      contract_address: hexAddress(coin.address),
      function_selector: "transfer(address,uint256)",
      parameter: padParameter(to) + units.toString(16).padStart(64, "0"),
      fee_limit: 100000000,
      call_value: 0,
      visible: false,
    });
    if (!data.result?.result) throw new Error(decodeMessage(data.result?.message) || "The node rejected this transfer.");
    return signAndBroadcast(data.transaction, mnemonic);
  }

  const data = await post("/wallet/createtransaction", {
    owner_address: hexAddress(from),
    to_address: hexAddress(to),
    amount: Math.round(Number(amount) * 1e6),
    visible: false,
  });
  if (!data.txID) throw new Error(decodeMessage(data.Error) || "The node rejected this transfer.");
  return signAndBroadcast(data, mnemonic);
}

export function tronFee(coin) {
  return coin.kind === "token" ? 30 : 1.1;
}