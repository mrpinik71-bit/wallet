// EVM networks this app reaches through your own dRPC key. dRPC names a few
// chains differently from this app, so the slug is spelled out per chain.
export const DRPC_NETWORKS = {
  ethereum: "ethereum",
  bsc: "bsc",
  base: "base",
  arbitrum: "arbitrum",
  polygon: "polygon",
  optimism: "optimism",
  avalanche: "avalanche",
  linea: "linea",
  scroll: "scroll",
  zksync: "zksync",
  mantle: "mantle",
  celo: "celo",
  gnosis: "gnosis",
  cronos: "cronos",
  fantom: "fantom",
  unichain: "unichain",
  sonic: "sonic",
  sei: "sei",
  core: "core",
  polygonzkevm: "polygon-zkevm",
  solana: "solana",
};

/** The app-side relay URL for a chain, or null when dRPC does not serve it. */
export function drpcRelay(chainId) {
  const network = DRPC_NETWORKS[chainId];
  return network ? `/api/rpc-drpc?network=${network}` : null;
}