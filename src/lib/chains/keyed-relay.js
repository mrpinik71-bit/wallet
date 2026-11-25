// Providers whose key lives on the server, never in the browser.
//
// Each route below answers 503 when its key has not been saved, so every reader
// tries its relay first and quietly falls back to the public node — a scan works
// the same with or without a key, it is only slower without one.
export const TRON_RELAY = "/api/rpc-tron";
export const TON_RELAY = "/api/rpc-ton";
export const SOLANA_RELAY = "/api/rpc-solana";

// A deployment that does not carry the relay routes answers 404 to every one of
// them. That is remembered once per run instead of being asked again for every
// wallet and every round, which wasted a round trip per chain on each batch.
const down = new Set();
const pathOf = (url) => String(url || "").split("?")[0];

/** True while this relay route is known to be missing from this deployment. */
export function relayDown(url) {
  return down.has(pathOf(url));
}

/** Records that a relay route answered 404/405, so it is not asked again. */
export function noteRelayDown(url) {
  const path = pathOf(url);
  if (path.startsWith("/api/")) down.add(path);
}

/** Every fresh scan asks the relays again. */
export function resetRelays() {
  down.clear();
}