// Multi-wallet reads for the non-EVM chains that accept several wallets in a
// single call: Solana accounts, Sui balances, Polkadot storage entries and
// Cardano addresses. Each returns wallet position → balance.
import { chains } from "@/lib/chains/config";
import { accountStorageKey, publicKeyFromAddress } from "@/lib/chains/polkadot";

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

/** SOL balances for many accounts (lamports, one call per 90 wallets). */
export async function solanaBalancesMany(addresses) {
  const balances = new Map();

  await Promise.all(
    group(addresses, 90).map(async ({ start, list }) => {
      const response = await fetch(chains.solana.rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getMultipleAccounts",
          params: [list, { encoding: "base64" }],
        }),
      });
      if (!response.ok) throw new Error(`Solana network error (${response.status}).`);
      const data = await response.json();
      if (data?.error) throw new Error("Solana network error.");

      const values = data?.result?.value;
      if (!Array.isArray(values)) throw new Error("Solana network error.");
      values.forEach((value, offset) => {
        if (offset >= list.length) return;
        // A missing account has never been funded.
        balances.set(start + offset, (value?.lamports || 0) / 1e9);
      });
    }),
  );

  return balances;
}

/** SUI balances for many addresses, as aliased fields of one GraphQL query. */
export async function suiBalancesMany(addresses) {
  const balances = new Map();

  await Promise.all(
    group(addresses, 20).map(async ({ start, list }) => {
      const fields = list
        .map(
          (address, offset) =>
            `a${offset}: address(address: "${address}") { balance(coinType: "0x2::sui::SUI") { totalBalance } }`,
        )
        .join(" ");
      const response = await fetch(chains.sui.api, {
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
        balances.set(start + offset, Number(total) / 1e9);
      });
    }),
  );

  return balances;
}

/** DOT balances from one state_getStorage batch (one call per 50 wallets). */
export async function polkadotBalancesMany(addresses) {
  const balances = new Map();

  await Promise.all(
    group(addresses, 50).map(async ({ start, list }) => {
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
      const response = await fetch(chains.polkadot.rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(calls),
      });
      if (!response.ok) throw new Error(`Polkadot network error (${response.status}).`);
      const body = await response.json();
      if (!Array.isArray(body)) throw new Error("Polkadot network error.");

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

/** ADA totals per wallet, from one address_info call for many addresses. */
export async function cardanoBalancesMany(addressLists) {
  const balances = new Map();
  const flat = [];
  addressLists.forEach((addresses, index) => {
    for (const address of addresses || []) flat.push({ index, address });
  });

  await Promise.all(
    group(flat, 100).map(async ({ list }) => {
      const response = await fetch(`${chains.cardano.api}/address_info`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ _addresses: list.map((row) => row.address) }),
      });
      if (!response.ok) throw new Error(`Cardano network error (${response.status}).`);
      const rows = await response.json();

      const byAddress = new Map();
      for (const row of Array.isArray(rows) ? rows : []) {
        byAddress.set(row.address, Number(row.balance || 0) / 1e6);
      }

      for (const row of list) {
        // A phrase can hold ADA on more than one base address, so they add up.
        const amount = byAddress.get(row.address) || 0;
        balances.set(row.index, (balances.get(row.index) || 0) + amount);
      }
    }),
  );

  return balances;
}