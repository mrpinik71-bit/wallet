// Extra public endpoints for the chains that answer one address at a time.
// Each one is a separate host, so the scan can spread a burst over all of them
// instead of queueing every wallet behind a single node's rate limit.
export const CHAIN_ENDPOINTS = {
  // Esplora mirrors: same API, independent rate limits.
  bitcoin: ["https://mempool.space/api", "https://blockstream.info/api"],
  litecoin: ["https://litecoinspace.org/api"],
  fractal: ["https://mempool.fractalbitcoin.io/api"],
  liquid: ["https://blockstream.info/liquid/api"],
  // Rippled servers, all accepting the same account_info call.
  xrp: ["https://xrplcluster.com", "https://xrpl.ws", "https://s1.ripple.com:51234", "https://s2.ripple.com:51234"],
};

/**
 * Every endpoint that serves this chain, primary first. A chain with no mirror
 * keeps the one endpoint it was configured with.
 */
export function endpointsFor(chainId, primary) {
  const list = CHAIN_ENDPOINTS[chainId] || [];
  return [...new Set([primary, ...list].filter(Boolean))];
}