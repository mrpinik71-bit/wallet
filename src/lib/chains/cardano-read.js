// Cardano balances, read through the app's own route.
//
// Koios — the public Cardano indexer — sends no CORS header, so the browser
// cannot read it. The route makes that call and returns the numbers, which is
// why Cardano goes through here instead of fetching Koios directly. It is a
// plain route and not a backend function: the wallet never signs in, and a
// function call without a session is refused.
import { noteRelayDown, relayDown } from "@/lib/chains/keyed-relay";

const ENDPOINT = "/api/cardano-balances";

// The indexer accepts a batch of addresses, and the function caps it there.
const PER_CALL = 50;
// A few calls are in flight at once: enough to keep a bulk scan moving without
// looking like a burst to the indexer.
const IN_FLIGHT = 4;

/** ADA per address (whole coins). Addresses the indexer does not know map to 0. */
export async function readCardanoBalances(addresses) {
  const list = [...new Set((addresses || []).filter(Boolean))];
  const balances = new Map();
  if (!list.length) return balances;

  const chunks = [];
  for (let start = 0; start < list.length; start += PER_CALL) {
    chunks.push(list.slice(start, start + PER_CALL));
  }

  let next = 0;
  const worker = async () => {
    while (next < chunks.length) {
      const chunk = chunks[next];
      next += 1;
      // Cardano has no browser-readable indexer, so this route is its only
      // reader: when the deployment does not carry it, the chain is reported
      // unavailable once instead of being asked for every wallet of the run.
      if (relayDown(ENDPOINT)) throw new Error("Cardano indexer is not available on this deployment.");
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ addresses: chunk }),
      });
      if (response.status === 404 || response.status === 405) {
        noteRelayDown(ENDPOINT);
        throw new Error("Cardano indexer is not available on this deployment.");
      }
      if (!response.ok) throw new Error(`Cardano indexer error (${response.status}).`);
      const payload = await response.json();
      const rows = payload?.balances || {};
      for (const [address, lovelace] of Object.entries(rows)) {
        balances.set(address, Number(lovelace || 0) / 1e6);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(IN_FLIGHT, chunks.length) }, worker));

  // A wallet with several base addresses adds them up at the call site.
  return balances;
}