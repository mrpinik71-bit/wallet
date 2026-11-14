// Extra EVM endpoints the bulk scan spreads its batches over.
//
// A public node answers a couple of large JSON-RPC batches and then refuses
// everything for a while, which used to make a chain look unreadable halfway
// through a scan. Every endpoint here was checked to accept batched reads from
// a browser and to stay reachable, so a scan rotates its batches across them
// instead of queueing everything on one node. Each chain keeps at least three
// readers (two mirrors plus its configured node), so one node refusing or going
// quiet falls through to the next instead of failing the chain for the batch —
// and no chain is left with a single reader.
//
// This map is for scanning only: the wallet's own reads keep using the single
// endpoint configured in `chains`.
export const EVM_MIRRORS = {
  ethereum: [
    "https://eth-mainnet.public.blastapi.io",
    "https://eth.drpc.org",
    "https://ethereum.publicnode.com",
  ],
  bsc: [
    "https://bsc-mainnet.public.blastapi.io",
    "https://bsc-dataseed.bnbchain.org",
    "https://bsc.drpc.org",
    "https://bsc-rpc.publicnode.com",
  ],
  base: [
    "https://base-mainnet.public.blastapi.io",
    "https://mainnet.base.org",
    "https://base.drpc.org",
    "https://base-rpc.publicnode.com",
  ],
  arbitrum: [
    "https://arbitrum-one.public.blastapi.io",
    "https://arb1.arbitrum.io/rpc",
    "https://arbitrum.drpc.org",
    "https://arbitrum-one-rpc.publicnode.com",
  ],
  polygon: [
    "https://polygon.drpc.org",
    "https://polygon-bor-rpc.publicnode.com",
  ],
  optimism: [
    "https://mainnet.optimism.io",
    "https://optimism.drpc.org",
    "https://optimism-rpc.publicnode.com",
  ],
  avalanche: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://avalanche-c-chain-rpc.publicnode.com",
    "https://avalanche.drpc.org",
  ],
  linea: ["https://rpc.linea.build", "https://linea.drpc.org", "https://linea-rpc.publicnode.com"],
  scroll: ["https://rpc.scroll.io", "https://scroll-rpc.publicnode.com", "https://scroll.drpc.org"],
  mantle: ["https://rpc.mantle.xyz", "https://mantle-rpc.publicnode.com", "https://mantle.drpc.org"],
  celo: ["https://forno.celo.org", "https://celo-rpc.publicnode.com", "https://celo.drpc.org"],
  gnosis: ["https://rpc.gnosischain.com", "https://gnosis-rpc.publicnode.com", "https://gnosis.drpc.org"],
  cronos: ["https://evm.cronos.org", "https://cronos-evm-rpc.publicnode.com", "https://cronos.drpc.org"],
  sonic: ["https://rpc.soniclabs.com", "https://sonic.drpc.org"],
  sei: ["https://evm-rpc.sei-apis.com", "https://sei-evm-rpc.publicnode.com", "https://sei.drpc.org"],
  berachain: ["https://rpc.berachain.com", "https://berachain-rpc.publicnode.com", "https://berachain.drpc.org"],
  kava: ["https://evm.kava.io", "https://kava-evm-rpc.publicnode.com", "https://kava.drpc.org"],
  unichain: ["https://mainnet.unichain.org", "https://unichain.drpc.org"],
  // Chains whose single configured node used to be the only reader they had.
  zksync: ["https://zksync.drpc.org"],
  fantom: ["https://fantom.drpc.org"],
  polygonzkevm: ["https://polygon-zkevm.drpc.org", "https://polygon-zkevm.rpc.thirdweb.com"],
  rootstock: ["https://rootstock.drpc.org"],
  abstract: ["https://abstract.drpc.org"],
  megaeth: ["https://megaeth.drpc.org"],
  bob: ["https://bob.drpc.org"],
  merlin: ["https://merlin.drpc.org"],
  core: ["https://rpc.ankr.com/core", "https://core.drpc.org"],
};