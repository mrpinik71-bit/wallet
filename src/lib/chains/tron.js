// TRON adapter: balances, TRC-20 reads and signed transfers via TronGrid.
import { SigningKey } from "ethers";
import bs58 from "bs58";
import { chains } from "@/lib/chains/config";
import { fromHex, toHex, tronAddress, tronPrivateKey } from "@/lib/chains/derive";
import { TRON_RELAY } from "@/lib/chains/keyed-relay";

// Three public hosts serve the same node API, so a busy one is not a failed
// chain: a read falls through to the next host that answers.
const APIS = [chains.tron.api, "https://tron-rpc.publicnode.com", "https://api.tronstack.io"];
// A transfer stays on the primary node — a write is not worth spreading around.
const PRIMARY = [chains.tron.api];

// The two reads the scan makes, relayed with the TronGrid key when one is saved.
const RELAY_OPS = {
  "/wallet/getaccount": "account",
  "/wallet/triggerconstantcontract": "call",
};

// A busy node answers 200 with an error body. Reading that as "balance 0" hid
// every wallet holding TRC-20 USDT, so an answer is checked before it is used.
function isAnswer(data, op) {
  if (!data || typeof data !== "object") return false;
  if (data.Error || data.error) return false;
  if (op === "call") {
    return (
      (Array.isArray(data.constant_result) && data.constant_result.length > 0) ||
      data.result?.result === true
    );
  }
  return true;
}

async function post(path, body, apis = APIS) {
  const op = RELAY_OPS[path] || null;
  // Reads go through the app's relay first: the key's own budget answers far
  // more wallets at once than the public node. No key saved answers 503 here,
  // and the public nodes below carry the read exactly as before.
  if (op) {
    try {
      const relayed = await fetch(`${TRON_RELAY}?op=${op}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (relayed.ok) {
        const data = await relayed.json();
        if (isAnswer(data, op)) return data;
      }
    } catch {
      // Fall through to the public nodes.
    }
  }

  let lastError = null;
  for (const api of apis) {
    try {
      const response = await fetch(`${api}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        lastError = new Error(`TRON network error (${response.status}).`);
        continue;
      }
      const data = await response.json();
      if (!isAnswer(data, op)) {
        lastError = new Error("TRON network error.");
        continue;
      }
      return data;
    } catch (cause) {
      lastError = cause;
    }
  }
  throw lastError || new Error("TRON network error.");
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

const amountFrom = (data, coin) => {
  const hex = data?.constant_result?.[0];
  if (!hex) return 0;
  return Number(BigInt(`0x${hex}`)) / 10 ** coin.decimals;
};

export async function trc20Balance(address, coin) {
  const body = {
    owner_address: hexAddress(address),
    contract_address: hexAddress(coin.address),
    function_selector: "balanceOf(address)",
    parameter: padParameter(address),
    visible: false,
  };
  // Every host is asked until one answers with a real balance, so a zero here
  // means the node read the contract and the wallet holds none of it.
  return amountFrom(await post("/wallet/triggerconstantcontract", body), coin);
}

async function signAndBroadcast(transaction, mnemonic, account = 0) {
  const signature = new SigningKey(tronPrivateKey(mnemonic, account)).sign(fromHex(transaction.txID));
  const bytes = new Uint8Array(65);
  bytes.set(fromHex(signature.r), 0);
  bytes.set(fromHex(signature.s), 32);
  bytes[64] = signature.yParity;

  const result = await post("/wallet/broadcasttransaction", { ...transaction, signature: [toHex(bytes)] }, PRIMARY);
  if (result.result === false) throw new Error(decodeMessage(result.message) || "The network rejected the transaction.");
  return result.txid || transaction.txID;
}

export async function tronSend({ mnemonic, coin, to, amount, account = 0 }) {
  const from = tronAddress(mnemonic, account);
  if (!isTronAddress(to)) throw new Error("That is not a valid TRON address.");

  if (coin.kind === "token") {
    const units = BigInt(Math.round(Number(amount) * 10 ** coin.decimals));
    const data = await post(
      "/wallet/triggersmartcontract",
      {
        owner_address: hexAddress(from),
        contract_address: hexAddress(coin.address),
        function_selector: "transfer(address,uint256)",
        parameter: padParameter(to) + units.toString(16).padStart(64, "0"),
        fee_limit: 100000000,
        call_value: 0,
        visible: false,
      },
      PRIMARY,
    );
    if (!data.result?.result) throw new Error(decodeMessage(data.result?.message) || "The node rejected this transfer.");
    return signAndBroadcast(data.transaction, mnemonic, account);
  }

  const data = await post(
    "/wallet/createtransaction",
    {
      owner_address: hexAddress(from),
      to_address: hexAddress(to),
      amount: Math.round(Number(amount) * 1e6),
      visible: false,
    },
    PRIMARY,
  );
  if (!data.txID) throw new Error(decodeMessage(data.Error) || "The node rejected this transfer.");
  return signAndBroadcast(data, mnemonic, account);
}

export function tronFee(coin) {
  return coin.kind === "token" ? 30 : 1.1;
}