// Providers whose key lives on the server, never in the browser.
//
// Each route below answers 503 when its key has not been saved, so every reader
// tries its relay first and quietly falls back to the public node — a scan works
// the same with or without a key, it is only slower without one.
export const TRON_RELAY = "/api/rpc-tron";
export const TON_RELAY = "/api/rpc-ton";
export const SOLANA_RELAY = "/api/rpc-solana";