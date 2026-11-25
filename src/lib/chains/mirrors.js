import { customEndpoint } from "@/lib/chains/custom-rpc";

// Extra public endpoints for the chains that answer one address at a time.
// Each one is a separate host, so the scan can spread a burst over all of them
// instead of queueing every wallet behind a single node's rate limit.
export const CHAIN_ENDPOINTS = {
  // Esplora mirrors: same API, independent rate limits. Every host below was
  // checked from a browser origin: it answers /address/:addr and sends
  // access-control-allow-origin, so the page may read the reply.
  bitcoin: [
    "https://mempool.space/api",
    "https://mempool.bitaroo.net/api",
    "https://mempool.ninja/api",
    "https://mempool.emzy.de/api",
    "https://blockstream.info/api",
  ],
  litecoin: ["https://litecoinspace.org/api"],
  fractal: ["https://mempool.fractalbitcoin.io/api"],
  // liquid.network stopped answering altogether, so Blockstream is the one
  // Liquid reader and its narrow lane in the scan is what keeps it answering.
  liquid: ["https://blockstream.info/liquid/api"],
  // Stacks: the same indexer under a second hostname, with its own request
  // budget, so a rate-limited host does not cost the chain its read.
  stacks: ["https://api.hiro.so"],
  // Aptos: the anonymous fullnode budget is shared per IP, so a second host
  // carries half the scan instead of every wallet queueing behind one limit.
  aptos: ["https://1rpc.io/aptos/v1"],
  // Rippled servers, all accepting the same account_info call. Ripple's own two
  // nodes send no CORS header, so a page could never read them: only the hosts
  // that answer a browser are listed.
  xrp: ["https://xrplcluster.com", "https://xrpl.ws"],
  // NEAR: the public mainnet node takes seconds per answer, so the gateway and
  // the FastNEAR mirror carry the read instead.
  near: ["https://near.drpc.org", "https://free.rpc.fastnear.com"],
};

/**
 * Every endpoint that serves this chain, primary first. A chain with no mirror
 * keeps the one endpoint it was configured with. An endpoint the user saved for
 * this chain is asked first: its own budget carries the whole scan.
 */
export function endpointsFor(chainId, primary) {
  const list = CHAIN_ENDPOINTS[chainId] || [];
  return [...new Set([customEndpoint(chainId), primary, ...list].filter(Boolean))];
}