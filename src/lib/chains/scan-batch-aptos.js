// Aptos balances for a whole batch in one request. The Aptos indexer answers
// the fungible-asset balance of many owners at once, so APT, USDC and USDT are
// read without a per-wallet view call — the per-wallet route spent the
// anonymous node's whole compute budget on a handful of wallets and came back
// refused for the rest, which is why Aptos looked broken on every scan.
const INDEXER = "https://indexer.mainnet.aptoslabs.com/v1/graphql";

const APT_TYPE = "0x1::aptos_coin::AptosCoin";

// The indexer keys owners by their full 32-byte address, while a derived
// address is usually short: both are padded to the same shape before asking.
const padded = (address) => {
  const hex = String(address || "").toLowerCase().replace(/^0x/, "").replace(/[^0-9a-f]/g, "");
  return hex ? `0x${hex.padStart(64, "0")}` : null;
};

/** The asset type this coin is held as: the native coin, or the token's own. */
const typeOf = (coin) => String(coin.address || APT_TYPE);
/** The same type, lowercased for comparing against an answered row. */
const keyOf = (coin) => typeOf(coin).toLowerCase();

const QUERY = `query($owners:[String!],$types:[String!]){
  current_fungible_asset_balances(
    where:{owner_address:{_in:$owners}, asset_type:{_in:$types}},
    limit:1000
  ){ owner_address asset_type amount }
}`;

/**
 * Balances for a batch of Aptos wallets: position → (asset id → balance).
 * Every wallet that was asked gets an entry for every asset, so a wallet with
 * nothing on Aptos is reported as empty instead of as a failed read.
 */
export async function aptosBalancesMany(addresses, coins) {
  const out = new Map();
  const owners = addresses.map(padded);
  const types = [...new Set(coins.map(typeOf))];
  if (!owners.length || !types.length) return out;

  const response = await fetch(INDEXER, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { owners, types } }),
  });
  if (!response.ok) throw new Error(`Aptos network error (${response.status}).`);

  const data = await response.json();
  const rows = data?.data?.current_fungible_asset_balances;
  if (!Array.isArray(rows)) throw new Error("Aptos network error.");

  // A wallet can hold more than one store of the same asset, so the amounts of
  // one owner and asset are added together.
  const held = new Map();
  for (const row of rows) {
    const key = `${String(row.owner_address).toLowerCase()}|${String(row.asset_type).toLowerCase()}`;
    held.set(key, (held.get(key) || 0) + (Number(row.amount) || 0));
  }

  addresses.forEach((address, position) => {
    const owner = padded(address);
    const values = new Map();
    for (const coin of coins) {
      const raw = held.get(`${owner}|${keyOf(coin)}`) || 0;
      values.set(coin.id, raw / 10 ** (coin.decimals || 8));
    }
    out.set(position, values);
  });

  return out;
}