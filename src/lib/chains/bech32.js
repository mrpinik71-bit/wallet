// Bech32 (BIP-173) helpers used for native segwit addresses.
const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i += 1) if ((top >> i) & 1) chk ^= GEN[i];
  }
  return chk >>> 0;
}

function hrpExpand(hrp) {
  const out = [];
  for (const char of hrp) out.push(char.charCodeAt(0) >> 5);
  out.push(0);
  for (const char of hrp) out.push(char.charCodeAt(0) & 31);
  return out;
}

function checksum(hrp, data) {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = polymod(values) ^ 1;
  const out = [];
  for (let i = 0; i < 6; i += 1) out.push((mod >> (5 * (5 - i))) & 31);
  return out;
}

function toWords(bytes) {
  let acc = 0;
  let bits = 0;
  const words = [];
  for (const byte of bytes) {
    acc = (acc << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      words.push((acc >> bits) & 31);
    }
  }
  if (bits > 0) words.push((acc << (5 - bits)) & 31);
  return words;
}

function fromWords(words) {
  let acc = 0;
  let bits = 0;
  const bytes = [];
  for (const word of words) {
    acc = (acc << 5) | word;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((acc >> bits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}

export function segwitEncode(hrp, version, program) {
  const data = [version].concat(toWords(program));
  const combined = data.concat(checksum(hrp, data));
  return `${hrp}1${combined.map((word) => CHARSET[word]).join("")}`;
}

export function segwitDecode(address) {
  const value = String(address || "").trim();
  const separator = value.lastIndexOf("1");
  if (separator < 1) throw new Error("Invalid address format.");
  const hrp = value.slice(0, separator).toLowerCase();
  const words = [...value.slice(separator + 1).toLowerCase()].map((char) => CHARSET.indexOf(char));
  if (words.some((word) => word < 0)) throw new Error("Invalid address format.");
  const data = words.slice(0, -6);
  if (!data.length) throw new Error("Invalid address format.");
  return { hrp, version: data[0], program: fromWords(data.slice(1)) };
}