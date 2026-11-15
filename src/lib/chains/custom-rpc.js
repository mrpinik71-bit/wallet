// Your own node endpoints, kept on this device only — one URL per chain.
// A key gives the scan its own request budget instead of the small public one,
// so the same wallet is read without waiting behind a shared rate limit.
const STORAGE_KEY = "helix.rpc.custom";
export const RPC_SETTINGS_EVENT = "helix-rpc-settings";

const valid = (value) => /^https:\/\/\S+$/i.test(String(value || "").trim());

/** Every saved endpoint, keyed by chain id. */
export function readCustomRpc() {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || typeof stored !== "object") return {};
    const out = {};
    for (const [chainId, url] of Object.entries(stored)) {
      if (valid(url)) out[chainId] = String(url).trim();
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(map) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(RPC_SETTINGS_EVENT));
}

export function setCustomEndpoint(chainId, url) {
  if (!chainId || !valid(url)) return;
  writeAll({ ...readCustomRpc(), [chainId]: String(url).trim() });
}

export function clearCustomEndpoint(chainId) {
  const next = { ...readCustomRpc() };
  delete next[chainId];
  writeAll(next);
}

/** The endpoint this chain should be read from, when one was saved. */
export function customEndpoint(chainId) {
  if (!chainId) return null;
  return readCustomRpc()[chainId] || null;
}