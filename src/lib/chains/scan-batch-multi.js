// Multi-wallet reads for the non-EVM chains that accept several wallets in a
// single call: Solana accounts, Sui balances, Polkadot storage entries and
// Cardano addresses. Each returns wallet position → balance.
import bs58 from "bs58";
import { sha256 } from "@noble/hashes/sha256";
import { chains } from "@/lib/chains/config";
import { customEndpoint } from "@/lib/chains/custom-rpc";
import { drpcRelay } from "@/lib/chains/drpc-relay";
import { SOLANA_RELAY } from "@/lib/chains/keyed-relay";
import { readCardanoBalances } from "@/lib/chains/cardano-read";
import { assetBalancesMany } from "@/lib/chains/asset-hub";
import { request } from "@/lib/chains/scan-lanes";
import { verifySolanaBalances } from "@/lib/chains/scan-verify";
import { accountStorageKey, POLKADOT_ENDPOINTS, publicKeyFromAddress } from "@/lib/chains/polkadot";

const hexOf = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const bytesOf = (hex) =>
  Uint8Array.from((hex.replace(/^0x/, "").match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16)));

/** Splits a list into groups, remembering where each group starts. */
function group(list, size) {
  const groups = [];
  for (let start = 0; start < list.length; start += size) {
    groups.push({ start, list: list.slice(start, start + size) });
  }
  return groups;
}

// The public Solana node answers at most 10 accounts per call, and refuses the
// whole request above that — which used to report every wallet as a failed read.
const SOLANA_ACCOUNTS = 10;
// Two nodes serve the same call, so a busy one is not a failed chain. Solana's
// own public node refuses requests that carry a browser origin (403), so the
// publicnode mirror is the one that can actually answer from the page, and the
// gateway behind it is the last resort when both are rate-limited.
const SOLANA_RPCS = [
  chains.solana.rpc,
  "https://solana-rpc.publicnode.com",
  "https://solana-mainnet.gateway.tatum.io",
  "https://api.mainnet-beta.solana.com",
];

/** Sends one Solana call, trying the next node when this one refuses or is busy. */
async function solanaCall(body) {
  let lastError = null;
  // The app's Helius relay first (its key is far wider than a public node),
  // then the saved endpoint, then the public nodes.
  const endpoints = [SOLANA_RELAY, drpcRelay("solana"), customEndpoint("solana"), ...SOLANA_RPCS].filter(Boolean);
  for (const endpoint of endpoints) {
    try {
      const response = await request(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Solana network error (${response.status}).`);
      const data = await response.json();
      if (data?.error) throw new Error("Solana network error.");
      return data;
    } catch (cause) {
      lastError = cause;
    }
  }
  throw lastError || new Error("Solana network error.");
}

/** SOL balances for many accounts (lamports, one call per 10 wallets). */
export async function solanaBalancesMany(addresses) {
  const balances = new Map();

  await Promise.all(
    group(addresses, SOLANA_ACCOUNTS).map(async ({ start, list }) => {
      let values = null;
      try {
        const data = await solanaCall({
          jsonrpc: "2.0",
          id: 1,
          method: "getMultipleAccounts",
          params: [list, { encoding: "base64" }],
        });
        values = data?.result?.value;
      } catch {
        // Unanswered group: the second opinion below asks an independent node,
        // so one busy node never reports a whole wall of wallets as failed.
        values = null;
      }
      if (!Array.isArray(values)) return;
      values.forEach((value, offset) => {
        if (offset >= list.length) return;
        // A missing account has never been funded.
        balances.set(start + offset, (value?.lamports || 0) / 1e9);
      });
    }),
  );

  // Second opinion: every wallet this pass reported empty — or could not answer
  // at all — is asked an independent node, and the higher answer stands.
  const doubtful = [];
  addresses.forEach((address, position) => {
    const value = balances.get(position);
    if (value === undefined || value === 0) doubtful.push({ position, address });
  });
  if (doubtful.length) {
    const second = await verifySolanaBalances(doubtful.map((row) => row.address));
    for (const row of doubtful) {
      const confirmed = second.get(row.address);
      if (confirmed === undefined) continue;
      if (confirmed > (balances.get(row.position) || 0)) balances.set(row.position, confirmed);
    }
  }

  return balances;
}

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ATA_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const PDA_MARKER = new TextEncoder().encode("ProgramDerivedAddress");

const join = (list) => {
  const total = list.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of list) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

/**
 * The one token account every wallet has for a mint. It is derived here, which
 * turns an owner lookup per wallet into a single batch read of those accounts.
 */
function associatedTokenAddress(owner, mint) {
  const seeds = [bs58.decode(owner), bs58.decode(TOKEN_PROGRAM), bs58.decode(mint)];
  // Bump 255 is the one every real wallet lands on; a lower bump would need an
  // on-curve hit, which cannot happen for a phrase-derived address.
  return bs58.encode(sha256(join([...seeds, Uint8Array.of(255), bs58.decode(ATA_PROGRAM), PDA_MARKER])));
}

/**
 * Every token account the wallet holds for this mint, standard or not: older
 * wallets and programs keep funds in accounts that are not the derived ATA.
 */
async function solanaOwnerTokenBalance(address, mint) {
  const data = await solanaCall({
    jsonrpc: "2.0",
    id: 1,
    method: "getTokenAccountsByOwner",
    params: [address, { mint }, { encoding: "jsonParsed" }],
  });
  const accounts = data?.result?.value;
  if (!Array.isArray(accounts)) throw new Error("Solana network error.");

  let total = 0;
  for (const account of accounts) {
    // The node already applied the mint's decimals, so this is a whole amount.
    const amount = Number(account?.account?.data?.parsed?.info?.tokenAmount?.uiAmountString);
    if (Number.isFinite(amount)) total += amount;
  }
  return total;
}

/** SPL token balances per wallet, read as each wallet's token account in one batch. */
export async function solanaTokenBalancesMany(addresses, mint, decimals = 0) {
  const balances = new Map();

  await Promise.all(
    group(addresses, SOLANA_ACCOUNTS).map(async ({ start, list }) => {
      const accounts = list.map((address) => associatedTokenAddress(address, mint));
      const data = await solanaCall({
        jsonrpc: "2.0",
        id: 1,
        method: "getMultipleAccounts",
        params: [accounts, { encoding: "base64" }],
      });

      const values = data?.result?.value;
      if (!Array.isArray(values)) throw new Error("Solana network error.");

      values.forEach((value, offset) => {
        if (offset >= list.length) return;
        // No token account for this mint means the wallet holds none of it.
        const encoded = value?.data?.[0];
        if (!encoded) {
          balances.set(start + offset, 0);
          return;
        }
        let raw;
        try {
          raw = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
        } catch {
          return;
        }
        if (raw.length < 72) {
          balances.set(start + offset, 0);
          return;
        }
        // Token account layout: mint (32), owner (32), then the amount as u64.
        let amount = 0n;
        for (let byte = 71; byte >= 64; byte -= 1) amount = (amount << 8n) | BigInt(raw[byte]);
        balances.set(start + offset, Number(amount) / 10 ** decimals);
      });
    }),
  );

  // The batch above only knows each wallet's standard token account. A wallet
  // whose standard account is empty can still hold the token in an older or
  // program-owned account, so those wallets are asked by owner — the one read
  // that sees every account the wallet owns for this mint.
  const doubtful = [];
  addresses.forEach((address, position) => {
    if (!(balances.get(position) > 0)) doubtful.push({ position, address });
  });

  const queue = [...doubtful];
  // Four at a time: ten owner lookups per mint on top of the batched read is what
  // tripped the node's burst limit and cost every SPL token (USDT, USDC, GRASS)
  // its answer.
  const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
    for (let row = queue.shift(); row; row = queue.shift()) {
      try {
        const amount = await solanaOwnerTokenBalance(row.address, mint);
        if (amount > (balances.get(row.position) || 0)) balances.set(row.position, amount);
        else if (balances.get(row.position) === undefined) balances.set(row.position, 0);
      } catch {
        // Unanswered: the batched answer stands, and a lost read is reported.
      }
    }
  });
  await Promise.all(workers);

  return balances;
}

/**
 * Sui balances for many addresses, as aliased fields of one GraphQL query. The
 * native coin is the default; USDT and USDC are the same read with a coin type.
 */
export async function suiBalancesMany(addresses, coinType = "0x2::sui::SUI", decimals = 9) {
  const balances = new Map();

  await Promise.all(
    group(addresses, 40).map(async ({ start, list }) => {
      const fields = list
        .map(
          (address, offset) =>
            `a${offset}: address(address: "${address}") { balance(coinType: "${coinType}") { totalBalance } }`,
        )
        .join(" ");
      const response = await request(chains.sui.api, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: `query { ${fields} }` }),
      });
      if (!response.ok) throw new Error(`Sui network error (${response.status}).`);
      const data = await response.json();
      if (!data?.data) throw new Error("Sui network error.");

      list.forEach((_, offset) => {
        const total = data.data[`a${offset}`]?.balance?.totalBalance;
        if (total === undefined || total === null) return;
        balances.set(start + offset, Number(total) / 10 ** decimals);
      });
    }),
  );

  return balances;
}

/** DOT balances from one state_getStorage batch (one call per 50 wallets). */
export async function polkadotBalancesMany(addresses) {
  const balances = new Map();

  await Promise.all(
    group(addresses, 100).map(async ({ start, list }) => {
      const keys = [];
      const positions = [];
      list.forEach((address, offset) => {
        try {
          keys.push(`0x${hexOf(accountStorageKey(publicKeyFromAddress(address)))}`);
          positions.push(offset);
        } catch {
          // An unreadable address is simply left out and reported as a failed read.
        }
      });
      if (!keys.length) return;

      const calls = keys.map((key, position) => ({
        jsonrpc: "2.0",
        id: position + 1,
        method: "state_getStorage",
        params: [key],
      }));
      // One batch may be spread over several relay nodes: a node that is busy
      // costs this round nothing, because the next one answers the same calls.
      let body = null;
      let lastError = null;
      for (const endpoint of POLKADOT_ENDPOINTS) {
        try {
          const response = await request(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(calls),
          });
          if (!response.ok) throw new Error(`Polkadot network error (${response.status}).`);
          const parsed = await response.json();
          if (!Array.isArray(parsed)) throw new Error("Polkadot network error.");
          body = parsed;
          break;
        } catch (cause) {
          lastError = cause;
        }
      }
      if (!body) throw lastError || new Error("Polkadot network error.");

      const raw = new Map();
      for (const item of body) {
        if (item && !item.error) raw.set(item.id, item.result);
      }

      keys.forEach((_, position) => {
        if (!raw.has(position + 1)) return;
        const result = raw.get(position + 1);
        const index = start + positions[position];
        // No storage entry means the account has never been funded.
        if (!result) {
          balances.set(index, 0);
          return;
        }
        const account = bytesOf(result);
        if (account.length < 32) {
          balances.set(index, 0);
          return;
        }
        // AccountInfo: nonce, consumers, providers, sufficients (4 × u32), then free (u128).
        let planck = 0n;
        for (let byte = 31; byte >= 16; byte -= 1) planck = (planck << 8n) | BigInt(account[byte]);
        balances.set(index, Number(planck) / 1e10);
      });
    }),
  );

  return balances;
}

/** USDT and USDC on Polkadot: one batched Assets.Account read on Asset Hub. */
export async function polkadotAssetBalancesMany(addresses, assetId, decimals = 6) {
  const raw = await assetBalancesMany(addresses.map((address) => ({ address, assetId })));
  const balances = new Map();
  for (const [index, amount] of raw) balances.set(index, amount / 10 ** decimals);
  return balances;
}

/**
 * ADA totals per wallet. Koios sends no CORS header, so the addresses go to the
 * app's backend function, which reads the same indexer server-side.
 */
export async function cardanoBalancesMany(addressLists) {
  const balances = new Map();
  const flat = [];
  addressLists.forEach((addresses, index) => {
    for (const address of addresses || []) flat.push({ index, address });
  });
  if (!flat.length) return balances;

  const byAddress = await readCardanoBalances(flat.map((row) => row.address));
  for (const row of flat) {
    // A phrase can hold ADA on more than one base address, so they add up.
    const amount = byAddress.get(row.address) || 0;
    balances.set(row.index, (balances.get(row.index) || 0) + amount);
  }

  return balances;
}