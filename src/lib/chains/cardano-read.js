// Cardano balances, read through the app's backend.
//
// Koios — the public Cardano indexer — sends no CORS header, so the browser
// cannot read it. The backend function makes that call and returns the numbers,
// which is why Cardano goes through here instead of fetching Koios directly.
import { base44 } from "@/api/base44Client";

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
      const result = await base44.functions.invoke("cardanoBalance", { addresses: chunk });
      const rows = result?.data?.balances ?? result?.balances ?? {};
      for (const [address, lovelace] of Object.entries(rows)) {
        balances.set(address, Number(lovelace || 0) / 1e6);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(IN_FLIGHT, chunks.length) }, worker));

  // A wallet with several base addresses adds them up at the call site.
  return balances;
}