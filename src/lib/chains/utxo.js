// Bitcoin / Litecoin adapter: native segwit (P2WPKH) balances and transfers.
import { SigningKey } from "ethers";
import { chains } from "@/lib/chains/config";
import { fromHex, hash160, sha256d, toHex, utxoKey } from "@/lib/chains/derive";
import { segwitDecode, segwitEncode } from "@/lib/chains/bech32";

const DUST = 546n;

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

function varint(value) {
  if (value < 0xfd) return Uint8Array.of(value);
  if (value <= 0xffff) return Uint8Array.of(0xfd, value & 0xff, (value >> 8) & 0xff);
  return Uint8Array.of(0xfe, value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
}

function derInteger(value) {
  let hex = BigInt(value).toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  let bytes = fromHex(hex);
  if (bytes[0] & 0x80) bytes = Uint8Array.from([0, ...bytes]);
  return Uint8Array.from([0x02, bytes.length, ...bytes]);
}

function derEncode(r, s) {
  const parts = [derInteger(r), derInteger(s)];
  return Uint8Array.from([0x30, parts[0].length + parts[1].length, ...parts[0], ...parts[1]]);
}

// `base` lets a caller read through a mirror of the same API; without it the
// chain's configured endpoint is used.
async function request(chainId, path, init, base) {
  const response = await fetch(`${base || chains[chainId].api}${path}`, init);
  if (!response.ok) throw new Error(`${chains[chainId].name} network error (${response.status}).`);
  return response;
}

export async function utxoBalance(chainId, address, base) {
  const data = await (await request(chainId, `/address/${address}`, undefined, base)).json();
  const stats = data.chain_stats || {};
  const sats = (stats.funded_txo_sum || 0) - (stats.spent_txo_sum || 0);
  return sats / 1e8;
}

async function fetchUtxos(chainId, address) {
  const data = await (await request(chainId, `/address/${address}/utxo`)).json();
  return (Array.isArray(data) ? data : []).filter((utxo) => utxo.status?.confirmed);
}

export async function utxoFeeRate(chainId) {
  const data = await (await request(chainId, "/v1/fees/recommended")).json();
  return Math.max(1, Math.ceil(data.halfHourFee || data.economyFee || 1));
}

function selectUtxos(utxos, target, feeRate) {
  const sorted = [...utxos].sort((a, b) => b.value - a.value);
  const selected = [];
  let total = 0n;
  for (const utxo of sorted) {
    selected.push(utxo);
    total += BigInt(utxo.value);
    const size = 11 + selected.length * 68 + 2 * 31;
    const fee = BigInt(Math.ceil(size * feeRate));
    if (total >= target + fee) return { selected, total, fee };
  }
  throw new Error("Not enough confirmed balance to cover this amount plus the network fee.");
}

export function isUtxoAddress(chainId, value) {
  try {
    const decoded = segwitDecode(value);
    return decoded.hrp === chains[chainId].hrp && decoded.program.length === 20;
  } catch {
    return false;
  }
}

function scriptFor(address) {
  const { version, program } = segwitDecode(address);
  return Uint8Array.from([version === 0 ? 0x00 : 0x50 + version, program.length, ...program]);
}

export async function utxoFee(chainId, address, amount, feeRate = null) {
  const [utxos, rate] = await Promise.all([fetchUtxos(chainId, address), feeRate ? Promise.resolve(feeRate) : utxoFeeRate(chainId)]);
  const target = BigInt(Math.round(Number(amount) * 1e8));
  const { fee } = selectUtxos(utxos, target, rate);
  return { fee: Number(fee) / 1e8, feeRate: rate };
}

export async function utxoSign({ chainId, mnemonic, to, amount, feeRate: rate, account = 0 }) {
  if (!isUtxoAddress(chainId, to)) throw new Error(`That is not a valid ${chains[chainId].name} address.`);
  const key = utxoKey(mnemonic, chainId, account);
  const target = BigInt(Math.round(Number(amount) * 1e8));
  if (target <= 0n) throw new Error("Enter an amount greater than zero.");

  const [utxos, feeRate] = await Promise.all([fetchUtxos(chainId, key.address), rate ? Promise.resolve(rate) : utxoFeeRate(chainId)]);
  const { selected, total, fee } = selectUtxos(utxos, target, feeRate);
  const change = total - target - fee;

  const outputs = [{ script: scriptFor(to), value: target }];
  if (change >= DUST) outputs.push({ script: scriptFor(key.address), value: change });

  const sequence = Uint8Array.of(0xff, 0xff, 0xff, 0xff);
  const hashPrevouts = sha256d(cat(selected.map((utxo) => cat([fromHex(utxo.txid).reverse(), u32(utxo.vout)]))));
  const hashSequence = sha256d(cat(selected.map(() => sequence)));
  const hashOutputs = sha256d(cat(outputs.map((output) => cat([u64(output.value), varint(output.script.length), output.script]))));

  const scriptCode = Uint8Array.from([0x19, 0x76, 0xa9, 0x14, ...key.script, 0x88, 0xac]);
  const signer = new SigningKey(key.privateKey);

  const signatures = selected.map((utxo) => {
    const preimage = cat([
      u32(2),
      hashPrevouts,
      hashSequence,
      fromHex(utxo.txid).reverse(),
      u32(utxo.vout),
      scriptCode,
      u64(BigInt(utxo.value)),
      sequence,
      hashOutputs,
      u32(0),
      u32(1),
    ]);
    const signature = signer.sign(sha256d(preimage));
    return cat([derEncode(BigInt(signature.r), BigInt(signature.s)), Uint8Array.of(1)]);
  });

  const transaction = cat([
    u32(2),
    Uint8Array.of(0x00, 0x01),
    varint(selected.length),
    ...selected.map((utxo) => cat([fromHex(utxo.txid).reverse(), u32(utxo.vout), varint(0), sequence])),
    varint(outputs.length),
    ...outputs.map((output) => cat([u64(output.value), varint(output.script.length), output.script])),
    ...selected.map((_, index) =>
      cat([varint(2), varint(signatures[index].length), signatures[index], varint(key.publicKey.length), key.publicKey]),
    ),
    u32(0),
  ]);

  return toHex(transaction);
}

export async function utxoBroadcast(chainId, rawTransaction) {
  const response = await request(chainId, "/tx", { method: "POST", body: rawTransaction, headers: { "content-type": "text/plain" } });
  return (await response.text()).trim();
}

export async function utxoSend({ chainId, mnemonic, to, amount, account = 0 }) {
  const hex = await utxoSign({ chainId, mnemonic, to, amount, account });
  return utxoBroadcast(chainId, hex);
}

export { segwitEncode, hash160 };